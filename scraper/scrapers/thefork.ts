import { chromium, Page } from 'playwright'
import { BaseScraper, ScraperResult, AvailabilitySlot } from './base.js'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

/**
 * TheFork scraper — uses browser to load the restaurant page and extract availability.
 * 
 * TheFork (formerly LaFourchette) has Datadome anti-bot on their API, but their
 * restaurant pages render availability in the DOM. We load the page, interact with
 * the date picker, and extract visible time slots.
 * 
 * We also intercept XHR responses in case the availability is loaded via AJAX.
 */
export class TheForkScraper extends BaseScraper {
  name = 'TheForkScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const restaurantId = this.config.id
    const restaurantName = this.config.name
    const theforkId = this.config.theforkId!

    console.log(`  [TheFork] Scraping ${restaurantName} (id: ${theforkId})...`)

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
        locale: 'en-GB',
      })
      const page = await context.newPage()

      // Intercept API responses for availability data
      const apiSlots: Array<{ date: string; time: string; partySize: number }> = []

      page.on('response', async (response) => {
        const url = response.url()
        if (
          (url.includes('timeslot') || url.includes('availability') || url.includes('slot')) &&
          response.status() === 200
        ) {
          try {
            const text = await response.text()
            if (text.startsWith('{') || text.startsWith('[')) {
              const data = JSON.parse(text)
              extractTheForkApiSlots(data, apiSlots)
            }
          } catch { /* ignore */ }
        }
      })

      const allSlots: AvailabilitySlot[] = []

      for (const partySize of PARTY_SIZES) {
        await randomDelay(1000, 2000)

        try {
          // TheFork restaurant page with booking widget
          const url = `https://www.thefork.com/restaurant/${theforkId}`
          console.log(`  [TheFork] Loading page for p${partySize}...`)

          await page.goto(url, { timeout: 25000, waitUntil: 'domcontentloaded' })
          await page.waitForTimeout(3000)

          // Accept cookies if banner appears
          const cookieBtn = await page.$('button[id*="accept"],button[data-test*="accept"],button:has-text("Accept")')
          if (cookieBtn) {
            await cookieBtn.click().catch(() => {})
            await randomDelay(500, 1000)
          }

          // Try to set party size
          await setPartySize(page, partySize)
          await randomDelay(500, 1000)

          // Check availability for today and coming weeks
          const now = new Date()
          for (let i = 1; i <= DAYS_AHEAD; i += 2) {
            const d = new Date(now)
            d.setDate(now.getDate() + i)
            const dateStr = d.toISOString().split('T')[0]

            // Try to navigate to this date in the widget
            const domSlots = await extractTheForkDomSlots(page, dateStr, partySize)
            for (const slot of domSlots) {
              mergeSlot(allSlots, slot.date, slot.time, partySize)
            }
          }
        } catch (err) {
          console.log(`  [TheFork] Error for p${partySize}: ${err}`)
        }
      }

      // Merge API-intercepted slots
      for (const s of apiSlots) {
        mergeSlot(allSlots, s.date, s.time, s.partySize)
      }

      await context.close()

      console.log(`  [TheFork] Found ${allSlots.length} slots for ${restaurantName}`)
      return { restaurantId, restaurantName, slots: allSlots, scrapedAt: new Date() }
    } catch (err) {
      console.error(`  [TheFork] Error for ${restaurantName}: ${err}`)
      return { restaurantId, restaurantName, slots: [], scrapedAt: new Date(), error: String(err) }
    } finally {
      try { await browser.close() } catch { /* already closed */ }
    }
  }
}

async function setPartySize(page: Page, size: number): Promise<void> {
  try {
    // TheFork typically has a party size selector
    const selectors = [
      'select[data-test*="party"],select[data-test*="covers"],select[name*="party"],select[name*="covers"]',
      '[data-test*="people"] select',
      'select[aria-label*="Guests"],select[aria-label*="people"],select[aria-label*="covers"]',
    ]

    for (const sel of selectors) {
      const select = await page.$(sel)
      if (select) {
        await select.selectOption(String(size))
        return
      }
    }

    // Try button-based selector
    const plusBtn = await page.$('button[aria-label*="Add guest"],button[data-test*="increase"]')
    if (plusBtn && size > 2) {
      for (let i = 2; i < size; i++) {
        await plusBtn.click()
        await randomDelay(200, 400)
      }
    }
  } catch {
    // Party size change failed — continue with default
  }
}

async function extractTheForkDomSlots(
  page: Page,
  dateStr: string,
  partySize: number,
): Promise<Array<{ date: string; time: string }>> {
  const slots: Array<{ date: string; time: string }> = []

  try {
    // TheFork renders time slots in various ways
    const selectors = [
      '[data-test*="timeslot"]',
      '[data-test*="time-slot"]',
      'button[data-test*="slot"]',
      '[class*="timeSlot"]',
      '[class*="TimeSlot"]',
      'button[class*="slot"]',
      // Booking widget slots
      '[data-testid*="slot"]',
      '[role="option"][data-time]',
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

        if (dataTime) {
          time = normalizeTime(dataTime)
        }

        if (!time && text) {
          time = normalizeTime(text.trim())
        }

        if (time) {
          slots.push({ date: dateStr, time })
        }
      }

      if (slots.length > 0) break
    }

    // Fallback: look for time patterns in the visible text
    if (slots.length === 0) {
      const bodyText = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body
        return main.innerText
      })

      if (bodyText) {
        const timeMatches = bodyText.match(/\b(\d{1,2}:\d{2})\b/g)
        if (timeMatches) {
          for (const t of timeMatches) {
            const normalized = normalizeTime(t)
            if (normalized && parseInt(normalized.split(':')[0]) >= 11) {
              slots.push({ date: dateStr, time: normalized })
            }
          }
        }
      }
    }
  } catch {
    // DOM extraction failed
  }

  return slots
}

function extractTheForkApiSlots(
  data: any,
  out: Array<{ date: string; time: string; partySize: number }>,
): void {
  try {
    // TheFork API response patterns
    const slots = data?.timeslots || data?.available_timeslots || data?.data?.timeslots || []

    if (Array.isArray(slots)) {
      for (const slot of slots) {
        const dt = slot.dateTime || slot.date_time || slot.time || slot.start
        const ps = slot.partySize || slot.party_size || slot.covers || 2

        if (dt) {
          const dateStr = typeof dt === 'string' && dt.includes('T') ? dt.split('T')[0] : undefined
          const timePart = typeof dt === 'string' && dt.includes('T') ? dt.split('T')[1] : dt
          const time = normalizeTime(timePart)

          if (dateStr && time) {
            out.push({ date: dateStr, time, partySize: ps })
          }
        }
      }
    }

    // Grouped by date format
    if (data?.dates && typeof data.dates === 'object') {
      for (const [date, daySlots] of Object.entries(data.dates)) {
        if (Array.isArray(daySlots)) {
          for (const slot of daySlots as any[]) {
            const time = normalizeTime(slot.time || slot.start || '')
            if (time) {
              out.push({ date, time, partySize: slot.partySize || 2 })
            }
          }
        }
      }
    }
  } catch { /* ignore */ }
}

function normalizeTime(raw: string): string | null {
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/)
  if (!match) return null

  let hours = parseInt(match[1])
  const mins = match[2]
  const period = match[3]?.toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  if (hours < 10 || hours > 23) return null

  return `${hours.toString().padStart(2, '0')}:${mins}`
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
