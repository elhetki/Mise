import { BaseScraper, ScraperResult, AvailabilitySlot } from './base'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

const RESY_API_KEY = 'VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5'

const RESY_HEADERS = {
  'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
  'X-Origin': 'https://resy.com',
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://resy.com/',
  'Origin': 'https://resy.com',
}

/**
 * Resy scraper — uses the public Resy API.
 * 1. Looks up venue_id from slug + location
 * 2. Queries availability for next 30 days at party sizes 2 and 4
 * 3. Falls back to simulation if API fails
 */
export class ResyScraper extends BaseScraper {
  name = 'ResyScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const { id: restaurantId, name: restaurantName, resySlug, resyCity } = this.config

    if (!resySlug || !resyCity) {
      return {
        restaurantId,
        restaurantName,
        slots: [],
        scrapedAt: new Date(),
        error: 'Missing resySlug or resyCity config',
      }
    }

    console.log(`  [Resy] Looking up venue_id for ${restaurantName} (slug: ${resySlug}, city: ${resyCity})`)

    try {
      const venueId = await this.getVenueId(resySlug, resyCity)
      if (!venueId) {
        console.log(`  [Resy] Could not find venue_id for ${restaurantName} — falling back to simulation`)
        return this.simulateAvailability(restaurantId, restaurantName)
      }

      console.log(`  [Resy] Found venue_id=${venueId} for ${restaurantName}, querying availability...`)
      const slots = await this.scrapeAvailability(venueId)
      console.log(`  [Resy] ${restaurantName}: ${slots.length} real slots found`)

      return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
    } catch (err) {
      console.error(`  [Resy] Error for ${restaurantName}: ${err}`)
      console.log(`  [Resy] Falling back to simulation for ${restaurantName}`)
      return this.simulateAvailability(restaurantId, restaurantName)
    }
  }

  private async getVenueId(slug: string, location: string): Promise<number | null> {
    await randomDelay(500, 1000)

    const url = `https://api.resy.com/3/venue?url_slug=${encodeURIComponent(slug)}&location=${encodeURIComponent(location)}`

    try {
      const res = await fetch(url, { headers: RESY_HEADERS })

      if (!res.ok) {
        console.log(`  [Resy] Venue lookup HTTP ${res.status} for slug=${slug}`)
        return null
      }

      const data = await res.json() as ResyVenueResponse
      return data?.id?.resy ?? null
    } catch (err) {
      console.log(`  [Resy] Venue lookup error: ${err}`)
      return null
    }
  }

  private async scrapeAvailability(venueId: number): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = []
    const now = new Date()

    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const daySlotsMap = new Map<string, Set<number>>()

      for (const partySize of PARTY_SIZES) {
        await randomDelay(500, 1000)

        const url = `https://api.resy.com/4/find?lat=0&long=0&day=${dateStr}&party_size=${partySize}&venue_id=${venueId}`

        try {
          const res = await fetch(url, { headers: RESY_HEADERS })

          if (!res.ok) {
            if (res.status === 429) {
              console.log(`  [Resy] Rate limited — waiting 5s`)
              await sleep(5000)
            }
            continue
          }

          const data = await res.json() as ResyFindResponse

          const configs = data?.results?.venues?.[0]?.slots ?? []
          for (const slot of configs) {
            const time = slot.date?.start?.split(' ')[1]?.slice(0, 5) ?? ''
            if (!time) continue

            if (!daySlotsMap.has(time)) {
              daySlotsMap.set(time, new Set())
            }
            daySlotsMap.get(time)!.add(partySize)
          }
        } catch (err) {
          console.log(`  [Resy] ${dateStr} p${partySize}: fetch error: ${err}`)
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

interface ResyVenueResponse {
  id: {
    resy: number
  }
  name: string
}

interface ResyFindResponse {
  results: {
    venues: Array<{
      slots: Array<{
        date: {
          start: string  // "2024-01-15 19:00:00"
          end: string
        }
        config: {
          token: string
          type: string
        }
        availability: {
          id: number
          remaining: number
        }
      }>
    }>
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
