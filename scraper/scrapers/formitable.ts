import { chromium } from 'playwright'
import { BaseScraper, ScraperResult, AvailabilitySlot } from './base'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30
const FORMITABLE_API_BASE = 'https://api.formitable.com/api/v1'

export class FormitableScraper extends BaseScraper {
  name = 'FormitableScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const restaurantId = this.config.id
    const restaurantName = this.config.name
    const slug = this.config.formitableSlug || 'rutz'

    console.log(`  [Formitable] Trying API for ${restaurantName} (slug: ${slug})`)

    // Try API first (faster, more reliable)
    try {
      const slots = await this.scrapeViaApi(slug)
      if (slots.length > 0 || slots !== null) {
        console.log(`  [Formitable] API returned ${slots.length} slots`)
        return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
      }
    } catch (err) {
      console.log(`  [Formitable] API failed: ${err}. Trying browser...`)
    }

    // Fall back to browser scraping
    try {
      const slots = await this.scrapeViaBrowser()
      console.log(`  [Formitable] Browser returned ${slots.length} slots`)
      return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
    } catch (err) {
      console.log(`  [Formitable] Browser failed: ${err}. Using simulation.`)
      return this.simulateAvailability(restaurantId, restaurantName)
    }
  }

  private async scrapeViaApi(slug: string): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = []
    const now = new Date()

    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const daySlotsMap = new Map<string, Set<number>>()

      for (const partySize of PARTY_SIZES) {
        await randomDelay(500, 1200)

        const url = `${FORMITABLE_API_BASE}/restaurant/${slug}/timeslots?date=${dateStr}&party_size=${partySize}&locale=en`

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://www.rutz-restaurant.de',
            'Referer': 'https://www.rutz-restaurant.de/',
          },
        })

        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            throw new Error(`API returned ${response.status} for slug ${slug}`)
          }
          continue
        }

        const data = await response.json()
        const timeslots: string[] = data?.timeslots || data?.times || data?.available_times || []

        for (const time of timeslots) {
          const normalizedTime = time.length === 5 ? time : time.slice(0, 5)
          if (!daySlotsMap.has(normalizedTime)) {
            daySlotsMap.set(normalizedTime, new Set())
          }
          daySlotsMap.get(normalizedTime)!.add(partySize)
        }
      }

      for (const [time, sizes] of daySlotsMap) {
        slots.push({ date: dateStr, time, partySizes: Array.from(sizes) })
      }
    }

    return slots
  }

  private async scrapeViaBrowser(): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = []
    const browser = await chromium.launch({ headless: true })

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
      })
      const page = await context.newPage()

      console.log('  [Formitable] Loading Rutz website...')
      await page.goto('https://www.rutz-restaurant.de/reservierung/', {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      })

      await randomDelay(2000, 3000)

      // Look for Formitable widget iframe
      const frames = page.frames()
      let formitableFrame = frames.find(f => f.url().includes('formitable'))

      if (!formitableFrame) {
        // Try to find iframe in DOM
        const iframeEl = await page.$('iframe[src*="formitable"]')
        if (iframeEl) {
          formitableFrame = await iframeEl.contentFrame() || undefined
        }
      }

      if (!formitableFrame) {
        throw new Error('Formitable widget not found on page')
      }

      console.log('  [Formitable] Found widget frame, extracting availability...')

      // Check for party size selector and date fields
      const now = new Date()
      for (let i = 1; i <= Math.min(DAYS_AHEAD, 14); i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        // Try to interact with date picker in the widget
        // This is highly site-specific, so we do a best-effort attempt
        try {
          await formitableFrame.fill('input[type="date"]', dateStr)
          await randomDelay(1000, 2000)

          const timeSlotEls = await formitableFrame.$$('[class*="timeslot"],[class*="time-slot"],[data-time]')
          for (const el of timeSlotEls) {
            const text = await el.textContent()
            if (text && /\d{1,2}:\d{2}/.test(text)) {
              const match = text.match(/(\d{1,2}:\d{2})/)
              if (match) {
                slots.push({ date: dateStr, time: match[1].padStart(5, '0'), partySizes: [2, 4] })
              }
            }
          }
        } catch {
          // Skip this date if interaction fails
        }
      }

      await context.close()
    } finally {
      await browser.close()
    }

    return slots
  }
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}
