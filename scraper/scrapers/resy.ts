import { BaseScraper, ScraperResult, AvailabilitySlot } from './base.js'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const DAYS_AHEAD = 30

const RESY_API_KEY = 'VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5'

/**
 * Pre-resolved venue IDs from Resy search API.
 * Key: resySlug from config, value: numeric venue_id.
 * These were resolved via the POST /3/venuesearch/search endpoint.
 */
const KNOWN_VENUE_IDS: Record<string, number> = {
  // NYC
  'eleven-madison-park': 70928,
  'le-bernardin': 1387,
  'carbone-new-york': 6194,
  'via-carota': 2567,
  'lartusi': 25973,
  'tatiana': 65452,
  'torrisi-new-york': 64593,
  'le-pavillon-new-york': 50955,
  'daniel-new-york': 29947,
  'the-four-horsemen': 2492,
  '4-charles-prime-rib': 834,
  // London (venue IDs to be discovered when Resy London API is accessible)
  // For now, London restaurants will fall back to simulation
}

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

  private async getVenueId(slug: string, _location: string): Promise<number | null> {
    // Check pre-resolved IDs first (fast path, no API call)
    if (KNOWN_VENUE_IDS[slug] !== undefined) {
      return KNOWN_VENUE_IDS[slug]
    }

    // Try the venue search API as fallback
    await randomDelay(500, 1000)

    try {
      const res = await fetch('https://api.resy.com/3/venuesearch/search', {
        method: 'POST',
        headers: { ...RESY_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: slug.replace(/-/g, ' '),
          slot_filter: {
            day: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            party_size: 2,
          },
        }),
      })

      if (!res.ok) {
        console.log(`  [Resy] Venue search HTTP ${res.status} for slug=${slug}`)
        return null
      }

      const data = await res.json() as ResySearchResponse
      const hits = data?.search?.hits ?? []

      // Find exact slug match
      const exact = hits.find(h => h.url_slug === slug)
      if (exact) return exact.id.resy

      // Find name match
      const nameMatch = hits.find(h =>
        h.name.toLowerCase().includes(slug.replace(/-/g, ' ').toLowerCase()) ||
        slug.replace(/-/g, ' ').toLowerCase().includes(h.name.toLowerCase())
      )
      if (nameMatch) return nameMatch.id.resy

      return null
    } catch (err) {
      console.log(`  [Resy] Venue search error: ${err}`)
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

interface ResySearchResponse {
  search: {
    hits: Array<{
      id: { resy: number }
      name: string
      url_slug: string
    }>
  }
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
