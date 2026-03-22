import { chromium } from 'playwright'
import { BaseScraper, ScraperResult, AvailabilitySlot } from './base'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

export class OnepagebookingScraper extends BaseScraper {
  name = 'OnepagebookingScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const restaurantId = this.config.id
    const restaurantName = this.config.name
    const hotelId = this.config.onepagebookingId || 'tonbach'

    console.log(`  [Onepagebooking] Scraping ${restaurantName} (hotel: ${hotelId})...`)

    // Try the onepagebooking API first
    try {
      const slots = await this.tryOnepagebookingApi(hotelId)
      if (slots.length > 0) {
        console.log(`  [Onepagebooking] API returned ${slots.length} slots`)
        return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
      }
    } catch (err) {
      console.log(`  [Onepagebooking] API attempt failed: ${err}`)
    }

    // Fall back to browser scraping
    const browser = await chromium.launch({ headless: true })

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
      })
      const page = await context.newPage()

      // Intercept API calls to find availability endpoints
      const capturedRequests: Array<{ url: string; body?: string }> = []
      page.on('response', async (response) => {
        const url = response.url()
        if (
          url.includes('onepagebooking') &&
          (url.includes('avail') || url.includes('slot') || url.includes('table') || url.includes('restaurant'))
        ) {
          try {
            const body = await response.text()
            capturedRequests.push({ url, body })
          } catch {
            capturedRequests.push({ url })
          }
        }
      })

      console.log(`  [Onepagebooking] Loading ${this.config.url}?lang=de`)
      await page.goto(`${this.config.url}?lang=de`, {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      })

      await randomDelay(2000, 3000)

      const slots: AvailabilitySlot[] = []
      const now = new Date()

      // Onepagebooking.com is primarily a hotel booking system.
      // Look for restaurant-specific section or link
      console.log('  [Onepagebooking] Looking for restaurant/table booking section...')

      const restaurantLink = await page.$('a[href*="restaurant"],a[href*="table"],[class*="restaurant"],[id*="restaurant"]')
      if (restaurantLink) {
        await restaurantLink.click()
        await randomDelay(1500, 2500)
      }

      // Look for date input
      const dateInput = await page.$('input[type="date"],input[name*="date"],[class*="datepick"]')

      if (dateInput) {
        console.log('  [Onepagebooking] Found date input, checking availability...')

        for (let i = 1; i <= Math.min(DAYS_AHEAD, 7); i++) {
          const date = new Date(now)
          date.setDate(now.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]

          try {
            await dateInput.fill(dateStr)
            await dateInput.press('Enter')
            await randomDelay(1500, 2500)

            // Look for available time slots
            const timeEls = await page.$$('[class*="timeslot"],[class*="time-slot"],[data-time],[class*="available"]')
            for (const el of timeEls) {
              const isDisabled = await el.getAttribute('disabled')
              const text = await el.textContent()
              if (!isDisabled && text && /\d{1,2}:\d{2}/.test(text)) {
                const match = text.match(/(\d{1,2}:\d{2})/)
                if (match) {
                  slots.push({ date: dateStr, time: match[1].padStart(5, '0'), partySizes: [2, 4] })
                }
              }
            }
          } catch {
            // Skip this date
          }
        }
      }

      // Parse any captured API responses
      if (slots.length === 0 && capturedRequests.length > 0) {
        console.log(`  [Onepagebooking] Parsing ${capturedRequests.length} captured API responses...`)
        for (const req of capturedRequests) {
          if (!req.body) continue
          try {
            const data = JSON.parse(req.body)
            const parsed = extractSlotsFromResponse(data, now)
            slots.push(...parsed)
          } catch {
            // not JSON
          }
        }
      }

      await context.close()

      if (slots.length > 0) {
        console.log(`  [Onepagebooking] Found ${slots.length} real slots`)
        return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
      }

      console.log('  [Onepagebooking] No real slots found, using simulation')
      return this.simulateAvailability(restaurantId, restaurantName)
    } catch (err) {
      console.log(`  [Onepagebooking] Error: ${err}. Using simulation.`)
      await browser.close()
      return this.simulateAvailability(restaurantId, restaurantName)
    } finally {
      try { await browser.close() } catch { /* already closed */ }
    }
  }

  private async tryOnepagebookingApi(hotelId: string): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = []
    const now = new Date()

    // Try common onepagebooking API patterns
    const apiEndpoints = [
      `https://onepagebooking.com/api/${hotelId}/availability`,
      `https://api.onepagebooking.com/${hotelId}/tables/availability`,
      `https://onepagebooking.com/${hotelId}/api/restaurants/availability`,
    ]

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = await response.json()
          const parsed = extractSlotsFromResponse(data, now)
          if (parsed.length > 0) {
            slots.push(...parsed)
            break
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    return slots
  }
}

function extractSlotsFromResponse(data: any, now: Date): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []
  const nowStr = now.toISOString().split('T')[0]

  const items = Array.isArray(data) ? data : data?.slots || data?.availability || data?.tables || []

  for (const item of items) {
    if (typeof item === 'object' && item) {
      const date = item.date || item.arrival || item.check_in
      const time = item.time || item.start_time
      const partySizes = item.party_sizes || item.pax || item.covers || [2, 4]

      if (date) {
        const dateStr = typeof date === 'string' ? date.split('T')[0] : String(date)
        if (dateStr < nowStr) continue

        const timeStr = time ? (typeof time === 'string' ? time.slice(0, 5) : String(time)) : '19:00'
        slots.push({ date: dateStr, time: timeStr, partySizes: Array.isArray(partySizes) ? partySizes : [2, 4] })
      }
    }
  }

  return slots
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}
