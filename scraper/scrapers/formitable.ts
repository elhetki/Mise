import { BaseScraper, ScraperResult, AvailabilitySlot } from './base'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

/**
 * Formitable/Zenchef scraper — uses the widget API directly.
 * API: https://widget-api.formitable.com/api/availability/{restaurantUid}/day/{dateISO}/{partySize}/en
 * No auth needed. Returns JSON array of timeslots.
 */
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
    const uid = this.config.formitableSlug!

    console.log(`  [Formitable] Querying API for ${restaurantName} (uid: ${uid})`)

    try {
      const slots = await this.scrapeViaApi(uid)
      console.log(`  [Formitable] API returned ${slots.length} real slots`)
      return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
    } catch (err) {
      console.error(`  [Formitable] API error for ${restaurantName}: ${err}`)
      return {
        restaurantId,
        restaurantName,
        slots: [],
        scrapedAt: new Date(),
        error: String(err),
      }
    }
  }

  private async scrapeViaApi(uid: string): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = []
    const now = new Date()

    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const daySlotsMap = new Map<string, Set<number>>()

      for (const partySize of PARTY_SIZES) {
        // Small delay to be respectful
        await randomDelay(300, 800)

        // The Formitable widget API expects the date as ISO with time set to 17:00 UTC
        const dateParam = `${dateStr}T17:00:00.000Z`
        const url = `https://widget-api.formitable.com/api/availability/${uid}/day/${dateParam}/${partySize}/en`

        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Origin': 'https://widget.formitable.com',
              'Referer': 'https://widget.formitable.com/',
            },
          })

          if (!response.ok) {
            console.log(`  [Formitable] ${dateStr} p${partySize}: HTTP ${response.status}`)
            continue
          }

          const data: FormitableSlot[] = await response.json()

          for (const slot of data) {
            if (slot.status !== 'AVAILABLE') continue

            const time = slot.timeString // e.g. "18:00"
            if (!daySlotsMap.has(time)) {
              daySlotsMap.set(time, new Set())
            }
            daySlotsMap.get(time)!.add(partySize)
          }
        } catch (err) {
          console.log(`  [Formitable] ${dateStr} p${partySize}: fetch error: ${err}`)
        }
      }

      for (const [time, sizes] of daySlotsMap) {
        slots.push({ date: dateStr, time, partySizes: Array.from(sizes) })
      }
    }

    return slots
  }
}

interface FormitableSlot {
  timeString: string      // "18:00"
  displayTime: string     // "6:00 PM"
  time: string            // ISO timestamp
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'FULL'
  partySize: number
  spotsTotal: number
  spotsOpen: number
  maxDuration: number
  area: string
  isExclusive: boolean
  waitlistAutoNotify: boolean
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}
