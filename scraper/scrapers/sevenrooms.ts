import { BaseScraper, ScraperResult, AvailabilitySlot } from './base.js'
import type { RestaurantScraperConfig } from '../config'

const PARTY_SIZES = [2, 4]
const NUM_DAYS = 30

/**
 * SevenRooms scraper — uses the public widget availability API.
 * No auth required — same endpoint used by the booking widget.
 *
 * API: GET https://www.sevenrooms.com/api-yoa/availability/timeslots
 * or:  GET https://api.sevenrooms.com/2_4/availability
 * Params: venue_id, date, party_size, channel=SEVENROOMS_WIDGET
 *
 * Falls back to simulation if API is unavailable or returns errors.
 */
export class SevenRoomsScraper extends BaseScraper {
  name = 'SevenRoomsScraper'
  private config: RestaurantScraperConfig

  constructor(config: RestaurantScraperConfig) {
    super()
    this.config = config
  }

  async scrape(): Promise<ScraperResult> {
    const { id: restaurantId, name: restaurantName, sevenroomsVenue } = this.config

    if (!sevenroomsVenue) {
      return {
        restaurantId,
        restaurantName,
        slots: [],
        scrapedAt: new Date(),
        error: 'Missing sevenroomsVenue config',
      }
    }

    console.log(`  [SevenRooms] Querying availability for ${restaurantName} (venue: ${sevenroomsVenue})`)

    try {
      const slots = await this.scrapeAvailability(sevenroomsVenue)

      if (slots.length > 0) {
        console.log(`  [SevenRooms] ${restaurantName}: ${slots.length} real slots found`)
        return { restaurantId, restaurantName, slots, scrapedAt: new Date() }
      }

      // API returned but no slots — fall back to simulation
      console.log(`  [SevenRooms] ${restaurantName}: No live slots found, falling back to simulation`)
      return this.simulateAvailability(restaurantId, restaurantName)
    } catch (err) {
      console.error(`  [SevenRooms] Error for ${restaurantName}: ${err}`)
      console.log(`  [SevenRooms] Falling back to simulation for ${restaurantName}`)
      return this.simulateAvailability(restaurantId, restaurantName)
    }
  }

  private async scrapeAvailability(venue: string): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = []
    const slotsMap = new Map<string, Map<string, Set<number>>>() // date → time → partySizes

    const now = new Date()

    for (const partySize of PARTY_SIZES) {
      // Try the YOA API first (used by the widget)
      for (let dayOffset = 1; dayOffset <= NUM_DAYS; dayOffset++) {
        const date = new Date(now)
        date.setDate(now.getDate() + dayOffset)
        const dateStr = date.toISOString().split('T')[0]

        await sleep(200 + Math.random() * 300)

        // Try the timeslots endpoint used by SevenRooms widgets
        const params = new URLSearchParams({
          venue_id: venue,
          date: dateStr,
          party_size: String(partySize),
          channel: 'SEVENROOMS_WIDGET',
          selected_language_code: 'en',
        })

        const url = `https://www.sevenrooms.com/api-yoa/availability/timeslots?${params.toString()}`

        try {
          const res = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': `https://www.sevenrooms.com/reservations/${venue}`,
              'Origin': 'https://www.sevenrooms.com',
            },
          })

          if (!res.ok) {
            if (res.status === 429) {
              console.log(`  [SevenRooms] Rate limited — waiting 5s`)
              await sleep(5000)
            } else if (res.status === 403 || res.status === 404) {
              // API not accessible — stop and return empty (will trigger simulation)
              return []
            }
            continue
          }

          const data = await res.json() as SevenRoomsTimeslotsResponse

          const timeslots = data?.data?.timeslots ?? data?.timeslots ?? []
          for (const slot of timeslots) {
            const time = slot.time_iso?.includes('T')
              ? slot.time_iso.split('T')[1]?.slice(0, 5) ?? ''
              : slot.time_iso?.slice(0, 5) ?? ''

            if (!time) continue

            if (!slotsMap.has(dateStr)) slotsMap.set(dateStr, new Map())
            const dateMap = slotsMap.get(dateStr)!
            if (!dateMap.has(time)) dateMap.set(time, new Set())
            dateMap.get(time)!.add(partySize)
          }
        } catch (err) {
          // Network error — return empty to trigger simulation
          console.log(`  [SevenRooms] Network error for ${venue} ${dateStr}: ${err}`)
          return []
        }
      }
    }

    // Convert map to AvailabilitySlot[]
    for (const [date, timeMap] of slotsMap) {
      for (const [time, sizes] of timeMap) {
        slots.push({ date, time, partySizes: Array.from(sizes) })
      }
    }

    return slots
  }
}

// ── Response types ──────────────────────────────────────────────────────────

interface SevenRoomsTimeslot {
  time_iso: string  // "2024-01-15T19:00:00" or "19:00:00"
}

interface SevenRoomsTimeslotsResponse {
  data?: {
    timeslots?: SevenRoomsTimeslot[]
  }
  timeslots?: SevenRoomsTimeslot[]
  status?: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
