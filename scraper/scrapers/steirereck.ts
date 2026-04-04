import { chromium } from 'playwright'
import { BaseScraper, ScraperResult, AvailabilitySlot } from './base.js'
import type { RestaurantScraperConfig } from '../config'

/**
 * Steirereck scraper — uses aleno.me booking widget via Playwright.
 * 
 * Strategy: Load the widget, click Buchen, intercept the timeslots API response.
 * The API returns slots for multiple days in one call.
 * The widget also serves Meierei im Stadtpark — we filter by restaurantName.
 */
export class SteirereckScraper extends BaseScraper {
  name = 'SteirereckScraper'
  private config: RestaurantScraperConfig

  private readonly BOOKING_URL = 'https://mytools.aleno.me/reservations/v2.0/reservations.html?k=eyJrIjoid2l2dTVrM2lsNm15cnBiOWlwdzZ4bmViajhycnVkaWRpZ280bGZwODBsbzlhNGlweTEiLCJyIjoiM3k2Z1pLUDljYW1ibmliVEMiLCJzIjoiaHR0cHM6Ly9teXRvb2xzLmFsZW5vLm1lLyJ9'

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const restaurantId = this.config.id
    const restaurantName = this.config.name

    console.log(`  [Steirereck] Scraping via aleno.me widget (browser)...`)

    const browser = await chromium.launch({ headless: true })

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
      })
      const page = await context.newPage()

      // Collect timeslot responses
      const collectedSlots: AlenoTimeslot[] = []

      page.on('response', async (response) => {
        if (response.url().includes('/api/aleno/v1/popup/timeslots') && response.status() === 200) {
          try {
            const data = await response.json()
            for (const [, slots] of Object.entries(data?.bookings || {})) {
              for (const slot of slots as AlenoTimeslot[]) {
                // Only Steirereck — not Meierei im Stadtpark
                if (slot.restaurantName === 'Steirereck') {
                  collectedSlots.push(slot)
                }
              }
            }
          } catch { /* ignore */ }
        }
      })

      // Load widget
      console.log(`  [Steirereck] Loading aleno widget...`)
      await page.goto(this.BOOKING_URL, { timeout: 30000, waitUntil: 'networkidle' })
      await randomDelay(1500, 2500)

      // Click Buchen — this triggers the timeslots API with default date (today/tomorrow)
      const buchen = await page.waitForSelector('button:has-text("Buchen")', { timeout: 10000 }).catch(() => null)
      if (buchen) {
        await buchen.click({ force: true })
        await page.waitForTimeout(3000)
      }

      // Now try different party sizes. We need to go back and change party size.
      // Reload with party size 4 to check that too
      const collectedSlots4: AlenoTimeslot[] = []

      page.removeAllListeners('response')
      page.on('response', async (response) => {
        if (response.url().includes('/api/aleno/v1/popup/timeslots') && response.status() === 200) {
          try {
            const data = await response.json()
            for (const [, slots] of Object.entries(data?.bookings || {})) {
              for (const slot of slots as AlenoTimeslot[]) {
                if (slot.restaurantName === 'Steirereck') {
                  collectedSlots4.push(slot)
                }
              }
            }
          } catch { /* ignore */ }
        }
      })

      // Reload widget fresh and set party to 4
      await page.goto(this.BOOKING_URL, { timeout: 30000, waitUntil: 'networkidle' })
      await randomDelay(1500, 2500)

      // Try to change party size to 4
      const personenBtn = await page.$('button:has-text("für 2")')
      if (personenBtn) {
        await personenBtn.click()
        await randomDelay(500, 1000)
        // Look for the option in the dropdown
        const opt4 = await page.$('text="4"')
        if (opt4) {
          await opt4.click()
          await randomDelay(500, 1000)
        }
      }

      const buchen2 = await page.waitForSelector('button:has-text("Buchen")', { timeout: 5000 }).catch(() => null)
      if (buchen2) {
        await buchen2.click({ force: true })
        await page.waitForTimeout(3000)
      }

      await context.close()

      // Process all collected slots
      const slots: AvailabilitySlot[] = []

      const processSlot = (ts: AlenoTimeslot, partySize: number) => {
        if (ts.timeslotFull) return
        if (ts.isUnavailableReason) return

        const slotDate = ts.selectedDate.split('T')[0]
        const utcDate = new Date(ts.selectedDate)
        const hours = utcDate.getUTCHours().toString().padStart(2, '0')
        const mins = utcDate.getUTCMinutes().toString().padStart(2, '0')
        const slotTime = `${hours}:${mins}`

        const existing = slots.find(s => s.date === slotDate && s.time === slotTime)
        if (existing) {
          if (!existing.partySizes.includes(partySize)) {
            existing.partySizes.push(partySize)
          }
        } else {
          slots.push({ date: slotDate, time: slotTime, partySizes: [partySize] })
        }
      }

      for (const ts of collectedSlots) processSlot(ts, 2)
      for (const ts of collectedSlots4) processSlot(ts, 4)

      console.log(`  [Steirereck] Found ${slots.length} real slots (from ${collectedSlots.length} p2 + ${collectedSlots4.length} p4 raw)`)
      return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
    } catch (err) {
      console.error(`  [Steirereck] Error: ${err}`)
      return { restaurantId, restaurantName, slots: [], scrapedAt: new Date(), error: String(err) }
    } finally {
      try { await browser.close() } catch { /* already closed */ }
    }
  }
}

interface AlenoTimeslot {
  restaurantId: string
  restaurantName: string
  selectedDate: string
  shiftName: string
  timeslotFull: boolean
  timeslotAlmostFull: number
  isUnavailableReason: string | null
  peopleCount: number
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}
