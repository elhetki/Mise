import { chromium } from 'playwright'
import { BaseScraper, ScraperResult, AvailabilitySlot } from './base'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

export class SteirereckScraper extends BaseScraper {
  name = 'SteirereckScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const restaurantId = this.config.id
    const restaurantName = this.config.name

    console.log(`  [Steirereck] Scraping ${restaurantName}...`)

    const browser = await chromium.launch({ headless: true })

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
      })
      const page = await context.newPage()

      console.log('  [Steirereck] Loading reservation page...')
      await page.goto('https://www.steirereck.at/steirereck-tisch.html', {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      })

      await randomDelay(2000, 3000)

      const slots: AvailabilitySlot[] = []
      const now = new Date()

      // Steirereck uses a SPA booking system — check if there's an embedded calendar
      // or if it redirects to a booking provider
      const currentUrl = page.url()
      console.log(`  [Steirereck] Current URL: ${currentUrl}`)

      // Look for common booking widget elements
      const hasIframe = await page.$('iframe')
      const hasBookingForm = await page.$('form[class*="booking"],form[class*="reservation"],#booking,#reservation')
      const hasDatePicker = await page.$('[type="date"],[class*="datepicker"],[class*="calendar"]')

      console.log(`  [Steirereck] Has iframe: ${!!hasIframe}, booking form: ${!!hasBookingForm}, date picker: ${!!hasDatePicker}`)

      if (hasIframe) {
        // Try iframe-based booking
        const iframeSrc = await hasIframe.getAttribute('src')
        console.log(`  [Steirereck] Iframe src: ${iframeSrc}`)

        const iframeFrame = await hasIframe.contentFrame()
        if (iframeFrame) {
          await randomDelay(1500, 2500)

          for (const partySize of PARTY_SIZES) {
            for (let i = 1; i <= Math.min(DAYS_AHEAD, 10); i++) {
              const date = new Date(now)
              date.setDate(now.getDate() + i)
              const dateStr = date.toISOString().split('T')[0]

              try {
                // Try to select party size
                const partySizeEl = await iframeFrame.$(`[value="${partySize}"],[data-party="${partySize}"]`)
                if (partySizeEl) {
                  await partySizeEl.click()
                  await randomDelay(500, 1000)
                }

                // Try to set date
                const dateInput = await iframeFrame.$('input[type="date"]')
                if (dateInput) {
                  await dateInput.fill(dateStr)
                  await randomDelay(1000, 2000)
                }

                // Look for time slots
                const timeEls = await iframeFrame.$$('[class*="time"],[class*="slot"],[data-time]')
                for (const el of timeEls) {
                  const text = await el.textContent()
                  if (text && /\d{1,2}:\d{2}/.test(text)) {
                    const match = text.match(/(\d{1,2}:\d{2})/)
                    if (match) {
                      const time = match[1].padStart(5, '0')
                      const existing = slots.find(s => s.date === dateStr && s.time === time)
                      if (existing) {
                        if (!existing.partySizes.includes(partySize)) {
                          existing.partySizes.push(partySize)
                        }
                      } else {
                        slots.push({ date: dateStr, time, partySizes: [partySize] })
                      }
                    }
                  }
                }
              } catch {
                // Skip
              }
            }
          }
        }
      }

      // If no slots found via browser interaction, try API detection approach
      if (slots.length === 0) {
        console.log('  [Steirereck] No slots via browser. Checking for API calls...')

        // Intercept network requests to find booking API
        const apiResponses: Array<{ url: string; body: string }> = []
        page.on('response', async (response) => {
          const url = response.url()
          if (
            url.includes('api') ||
            url.includes('availability') ||
            url.includes('booking') ||
            url.includes('reservation')
          ) {
            try {
              const body = await response.text()
              if (body.includes('time') || body.includes('slot') || body.includes('available')) {
                apiResponses.push({ url, body: body.slice(0, 2000) })
              }
            } catch {
              // ignore
            }
          }
        })

        // Reload and interact to trigger API calls
        await page.reload({ timeout: 20000, waitUntil: 'domcontentloaded' })
        await randomDelay(3000, 4000)

        // Try clicking on date elements to trigger availability requests
        const dateEl = await page.$('[type="date"],[class*="date"],[id*="date"]')
        if (dateEl) {
          await dateEl.click()
          await randomDelay(2000, 3000)
        }

        if (apiResponses.length > 0) {
          console.log(`  [Steirereck] Found ${apiResponses.length} API responses, parsing...`)
          for (const resp of apiResponses.slice(0, 5)) {
            try {
              const data = JSON.parse(resp.body)
              const parsed = extractSlotsFromApiResponse(data, restaurantId, now)
              slots.push(...parsed)
            } catch {
              // Not JSON or unparseable
            }
          }
        }
      }

      await context.close()

      if (slots.length > 0) {
        console.log(`  [Steirereck] Found ${slots.length} real slots`)
        return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
      }

      // Fall back to simulation
      console.log('  [Steirereck] No real slots found, using simulation')
      return this.simulateAvailability(restaurantId, restaurantName)
    } catch (err) {
      console.log(`  [Steirereck] Error: ${err}. Using simulation.`)
      await browser.close()
      return this.simulateAvailability(restaurantId, restaurantName)
    } finally {
      try { await browser.close() } catch { /* already closed */ }
    }
  }
}

function extractSlotsFromApiResponse(data: any, _restaurantId: string, now: Date): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []

  // Try common response formats
  const items = Array.isArray(data) ? data : data?.slots || data?.availability || data?.times || []

  for (const item of items) {
    if (typeof item === 'string' && /\d{4}-\d{2}-\d{2}/.test(item)) {
      // Date string
      const dateMatch = item.match(/(\d{4}-\d{2}-\d{2})/)
      const timeMatch = item.match(/(\d{2}:\d{2})/)
      if (dateMatch && timeMatch) {
        slots.push({ date: dateMatch[1], time: timeMatch[1], partySizes: [2, 4] })
      }
    } else if (typeof item === 'object' && item) {
      const date = item.date || item.day || item.booking_date
      const time = item.time || item.start_time || item.booking_time
      const partySizes = item.party_sizes || item.covers || [2, 4]

      if (date && time) {
        const dateStr = typeof date === 'string' ? date.split('T')[0] : String(date)
        const timeStr = typeof time === 'string' ? time.slice(0, 5) : String(time)
        slots.push({ date: dateStr, time: timeStr, partySizes: Array.isArray(partySizes) ? partySizes : [2, 4] })
      }
    }
  }

  // Validate dates are in the future
  const nowStr = now.toISOString().split('T')[0]
  return slots.filter(s => s.date >= nowStr)
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}
