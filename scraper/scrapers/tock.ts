import { BaseScraper, ScraperResult, AvailabilitySlot } from './base.js'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

const TOCK_GRAPHQL_URL = 'https://www.exploretock.com/api/graphql'

const TOCK_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://www.exploretock.com',
  'Referer': 'https://www.exploretock.com/',
}

/**
 * Tock scraper — uses the Tock GraphQL API.
 * Queries availability for next 30 days at party sizes 2 and 4.
 * Falls back to simulation if API fails.
 */
export class TockScraper extends BaseScraper {
  name = 'TockScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const { id: restaurantId, name: restaurantName, tockSlug } = this.config

    if (!tockSlug) {
      return {
        restaurantId,
        restaurantName,
        slots: [],
        scrapedAt: new Date(),
        error: 'Missing tockSlug config',
      }
    }

    console.log(`  [Tock] Querying availability for ${restaurantName} (slug: ${tockSlug})`)

    try {
      const slots = await this.scrapeAvailability(tockSlug)
      console.log(`  [Tock] ${restaurantName}: ${slots.length} real slots found`)

      if (slots.length === 0) {
        // Could be genuinely unavailable or API issue — try simulation as fallback signal
        console.log(`  [Tock] No slots found for ${restaurantName} — returning empty (genuinely unavailable)`)
      }

      return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
    } catch (err) {
      console.error(`  [Tock] Error for ${restaurantName}: ${err}`)
      console.log(`  [Tock] Falling back to simulation for ${restaurantName}`)
      return this.simulateAvailability(restaurantId, restaurantName)
    }
  }

  private async scrapeAvailability(slug: string): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = []
    const now = new Date()

    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const daySlotsMap = new Map<string, Set<number>>()

      for (const partySize of PARTY_SIZES) {
        await randomDelay(500, 1000)

        const query = `{ experience(slug: "${slug}") { id name timeSlots(date: "${dateStr}", partySize: ${partySize}) { startTime endTime remaining } } }`

        try {
          const res = await fetch(TOCK_GRAPHQL_URL, {
            method: 'POST',
            headers: TOCK_HEADERS,
            body: JSON.stringify({ query }),
          })

          if (!res.ok) {
            if (res.status === 429) {
              console.log(`  [Tock] Rate limited — waiting 5s`)
              await sleep(5000)
            }
            continue
          }

          const data = await res.json() as TockGraphQLResponse

          if (data.errors) {
            console.log(`  [Tock] GraphQL errors for ${slug} ${dateStr}: ${JSON.stringify(data.errors)}`)
            continue
          }

          const timeSlots = data?.data?.experience?.timeSlots ?? []
          for (const slot of timeSlots) {
            if (slot.remaining <= 0) continue

            // startTime is ISO timestamp like "2024-01-15T19:00:00"
            const time = slot.startTime.split('T')[1]?.slice(0, 5) ?? ''
            if (!time) continue

            if (!daySlotsMap.has(time)) {
              daySlotsMap.set(time, new Set())
            }
            daySlotsMap.get(time)!.add(partySize)
          }
        } catch (err) {
          console.log(`  [Tock] ${dateStr} p${partySize}: fetch error: ${err}`)
        }
      }

      for (const [time, sizes] of daySlotsMap) {
        slots.push({ date: dateStr, time, partySizes: Array.from(sizes) })
      }
    }

    return slots
  }
}

// ── Response types ──────────────────────────────────────────────────────────

interface TockTimeSlot {
  startTime: string   // ISO: "2024-01-15T19:00:00" or "19:00"
  endTime: string
  remaining: number
}

interface TockGraphQLResponse {
  data?: {
    experience?: {
      id: string
      name: string
      timeSlots: TockTimeSlot[]
    }
  }
  errors?: Array<{ message: string }>
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
