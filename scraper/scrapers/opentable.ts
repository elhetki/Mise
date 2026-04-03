import { chromium, Page } from 'playwright'
import { BaseScraper, ScraperResult, AvailabilitySlot } from './base'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

/**
 * OpenTable scraper — uses browser to load the restaurant page and extract availability.
 * 
 * OpenTable blocks direct API calls but the availability widget on each restaurant
 * page makes XHR calls to their internal API. We intercept those responses.
 * 
 * Fallback: parse the visible time slot buttons from the page DOM.
 */
export class OpenTableScraper extends BaseScraper {
  name = 'OpenTableScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const restaurantId = this.config.id
    const restaurantName = this.config.name
    const slug = this.config.opentableSlug!

    console.log(`  [OpenTable] Scraping ${restaurantName} (slug: ${slug})...`)

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
        locale: 'en-US',
      })
      const page = await context.newPage()

      // Collect API responses
      const apiSlots: Array<{ date: string; time: string; partySize: number }> = []

      page.on('response', async (response) => {
        const url = response.url()
        if (
          (url.includes('/availability') || url.includes('/timeslots') || url.includes('dapi')) &&
          response.status() === 200
        ) {
          try {
            const text = await response.text()
            if (text.startsWith('{') || text.startsWith('[')) {
              const data = JSON.parse(text)
              extractApiSlots(data, apiSlots)
            }
          } catch { /* ignore */ }
        }
      })

      const allSlots: AvailabilitySlot[] = []

      for (const partySize of PARTY_SIZES) {
        const now = new Date()
        // Check a few dates spread across the next 30 days
        const datesToCheck: string[] = []
        for (let i = 1; i <= DAYS_AHEAD; i += 3) {
          const d = new Date(now)
          d.setDate(now.getDate() + i)
          datesToCheck.push(d.toISOString().split('T')[0])
        }

        for (const dateStr of datesToCheck) {
          await randomDelay(1000, 2000)

          try {
            const url = `https://www.opentable.com/r/${slug}?dateTime=${dateStr}T19:00&covers=${partySize}&language=en-US`
            console.log(`  [OpenTable] Checking ${dateStr} p${partySize}...`)

            await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(3000)

            // Try to find time slot buttons in the DOM
            const domSlots = await extractDomSlots(page, dateStr, partySize)
            for (const slot of domSlots) {
              mergeSlot(allSlots, slot.date, slot.time, partySize)
            }
          } catch (err) {
            console.log(`  [OpenTable] ${dateStr} p${partySize}: page error, skipping`)
          }
        }
      }

      // Also merge any API-intercepted slots
      for (const s of apiSlots) {
        mergeSlot(allSlots, s.date, s.time, s.partySize)
      }

      await context.close()

      console.log(`  [OpenTable] Found ${allSlots.length} slots for ${restaurantName}`)
      return { restaurantId, restaurantName, slots: allSlots, scrapedAt: new Date() }
    } catch (err) {
      console.error(`  [OpenTable] Error for ${restaurantName}: ${err}`)
      return { restaurantId, restaurantName, slots: [], scrapedAt: new Date(), error: String(err) }
    } finally {
      try { await browser.close() } catch { /* already closed */ }
    }
  }
}

async function extractDomSlots(
  page: Page,
  dateStr: string,
  partySize: number,
): Promise<Array<{ date: string; time: string }>> {
  const slots: Array<{ date: string; time: string }> = []

  try {
    // OpenTable renders time slots as buttons with data-test attributes or specific classes
    // Try multiple selectors that OpenTable uses
    const selectors = [
      'button[data-test*="timeslot"]',
      '[data-test="time-slot"]',
      'button[class*="timeslot"]',
      '[class*="TimeSlot"]',
      'button[data-time]',
      // Their newer UI uses these patterns
      '[data-test="availability-button"]',
      'li[data-test] button',
    ]

    for (const selector of selectors) {
      const elements = await page.$$(selector)
      if (elements.length === 0) continue

      for (const el of elements) {
        const text = await el.textContent()
        const dataTime = await el.getAttribute('data-time')
        const isDisabled = await el.getAttribute('disabled')
        const ariaDisabled = await el.getAttribute('aria-disabled')

        if (isDisabled || ariaDisabled === 'true') continue

        let time: string | null = null

        // Try data attribute first
        if (dataTime) {
          time = normalizeTime(dataTime)
        }

        // Try text content
        if (!time && text) {
          time = extractTimeFromText(text)
        }

        if (time) {
          slots.push({ date: dateStr, time })
        }
      }

      if (slots.length > 0) break // Found slots with this selector
    }

    // Fallback: search for any time-like text in the availability section
    if (slots.length === 0) {
      const availSection = await page.$('[data-test*="avail"],[class*="avail"],[id*="avail"]')
      if (availSection) {
        const text = await availSection.textContent()
        if (text) {
          const timeMatches = text.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/g)
          if (timeMatches) {
            for (const t of timeMatches) {
              const normalized = normalizeTime(t)
              if (normalized) {
                slots.push({ date: dateStr, time: normalized })
              }
            }
          }
        }
      }
    }
  } catch {
    // DOM parsing failed
  }

  return slots
}

function normalizeTime(raw: string): string | null {
  // Handle "7:00 PM" → "19:00"
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/)
  if (!match) return null

  let hours = parseInt(match[1])
  const mins = match[2]
  const period = match[3]?.toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  // Restaurant hours are typically 11:00-23:00
  if (hours < 10 || hours > 23) return null

  return `${hours.toString().padStart(2, '0')}:${mins}`
}

function extractTimeFromText(text: string): string | null {
  const cleaned = text.trim()
  return normalizeTime(cleaned)
}

function extractApiSlots(
  data: any,
  out: Array<{ date: string; time: string; partySize: number }>,
): void {
  try {
    // OpenTable API response formats vary — try common patterns
    const availability = data?.availability || data?.data?.availability || data

    if (Array.isArray(availability)) {
      for (const item of availability) {
        const slots = item?.timeslots || item?.slots || item?.times || []
        const dateStr = item?.date || item?.dateTime?.split('T')[0]

        for (const slot of slots) {
          const time = slot?.dateTime || slot?.time || slot?.start
          const partySize = slot?.partySize || slot?.covers || 2

          if (time && dateStr) {
            const normalized = normalizeTime(typeof time === 'string' && time.includes('T') ? time.split('T')[1] : time)
            if (normalized) {
              out.push({ date: dateStr, time: normalized, partySize })
            }
          }
        }
      }
    }

    // Nested format: { availabilityDays: [{ date, slots: [{ dateTime }] }] }
    const days = data?.availabilityDays || data?.data?.availabilityDays
    if (Array.isArray(days)) {
      for (const day of days) {
        const dateStr = day.date
        for (const slot of day.slots || []) {
          const dt = slot.dateTime || slot.time
          if (dt) {
            const timePart = typeof dt === 'string' && dt.includes('T') ? dt.split('T')[1] : dt
            const normalized = normalizeTime(timePart)
            if (normalized) {
              out.push({ date: dateStr, time: normalized, partySize: 2 })
            }
          }
        }
      }
    }
  } catch { /* ignore parse errors */ }
}

function mergeSlot(slots: AvailabilitySlot[], date: string, time: string, partySize: number): void {
  const existing = slots.find(s => s.date === date && s.time === time)
  if (existing) {
    if (!existing.partySizes.includes(partySize)) {
      existing.partySizes.push(partySize)
    }
  } else {
    slots.push({ date, time, partySizes: [partySize] })
  }
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}
