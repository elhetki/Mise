export interface RestaurantScraperConfig {
  id: string // UUID from restaurants table
  name: string
  type: 'formitable' | 'steirereck' | 'onepagebooking' | 'opentable' | 'thefork' | 'phone_only' | 'email_only'
  url: string
  // Additional config per type
  formitableSlug?: string   // Formitable/Zenchef restaurant UID
  onepagebookingId?: string
  alenoKey?: string         // Aleno widget key
  alenoRestaurantId?: string
  opentableSlug?: string    // OpenTable URL slug (e.g. "the-table-kevin-fehling-hamburg")
  theforkId?: string        // TheFork restaurant ID (from URL: /restaurant/r{ID})
}

/**
 * Maps restaurants to their booking system configs.
 * 
 * Known booking systems (researched 2026-03-26):
 * 
 * ✅ SCRAPEABLE:
 * - Rutz (Berlin, 2★): Formitable/Zenchef API — uid: a0f9601c
 * - Steirereck (Wien, 2★): aleno.me widget — browser-based
 * - The Table Kevin Fehling (Hamburg, 3★): OpenTable — opentable.com/r/the-table-kevin-fehling-hamburg
 * - Aqua (Wolfsburg, 2★): OpenTable — opentable.com/aqua-the-ritz-carlton-wolfsburg
 * - Victor's Fine Dining (Perl, 3★): OpenTable (via Michelin Guide partnership)
 * - Vendôme (Bergisch Gladbach, 3★): TheFork — thefork.com/restaurant/vendome-r622705
 * - Überfahrt (Rottach-Egern, 3★): TheFork — thefork.com/restaurant/restaurant-uberfahrt-christian-jurgens-r622837
 * 
 * ❌ NO ONLINE BOOKING:
 * - Schwarzwaldstube (Baiersbronn, 3★): Phone (07442/492 665) / email only
 * - JAN (München, 3★): Phone only — fixed reservation windows (Tue-Fri 18:30-19:00)
 * - Sonnora (Dreis, 3★): Phone (06508 406) / email only
 * - Amador (Wien, 2★→3★): Email only (reservations@palais-coburg.com → credit card required)
 * - Silvio Nickol (Wien, 2★): Phone/email only (reservations@palais-coburg.com)
 */
export async function getScraperConfigs(supabase: any): Promise<RestaurantScraperConfig[]> {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, booking_type, booking_url')
    .eq('active', true)

  if (!restaurants) return []

  const configs: RestaurantScraperConfig[] = []

  for (const r of restaurants) {
    const config = getConfigForRestaurant(r)
    if (config) {
      configs.push(config)
    }
  }

  return configs
}

function getConfigForRestaurant(r: any): RestaurantScraperConfig | null {
  // Known restaurant → scraper mappings
  const KNOWN_CONFIGS: Record<string, Partial<RestaurantScraperConfig>> = {
    // ✅ Formitable API (working since day 1)
    'Rutz': {
      type: 'formitable',
      url: 'https://rutz-restaurant.de/en/',
      formitableSlug: 'a0f9601c',
    },

    // ✅ Aleno browser scraper (working since day 1)
    'Steirereck': {
      type: 'steirereck',
      url: 'https://www.steirereck.at/steirereck-tisch.html',
      alenoRestaurantId: '3y6gZKP9cambnibTC',
    },

    // ✅ OpenTable — browser scraper
    'The Table Kevin Fehling': {
      type: 'opentable',
      url: 'https://www.opentable.com/r/the-table-kevin-fehling-hamburg',
      opentableSlug: 'the-table-kevin-fehling-hamburg',
    },

    // ✅ OpenTable — browser scraper
    'Aqua': {
      type: 'opentable',
      url: 'https://www.opentable.com/aqua-the-ritz-carlton-wolfsburg',
      opentableSlug: 'aqua-the-ritz-carlton-wolfsburg',
    },

    // ✅ OpenTable — browser scraper (via Michelin partnership)
    "Victor's Fine Dining": {
      type: 'opentable',
      url: 'https://www.opentable.com/r/victors-fine-dining-by-christian-bau-perl',
      opentableSlug: 'victors-fine-dining-by-christian-bau-perl',
    },

    // ✅ TheFork — browser scraper
    'Vendôme': {
      type: 'thefork',
      url: 'https://www.thefork.com/restaurant/vendome-r622705',
      theforkId: 'vendome-r622705',
    },

    // ✅ TheFork — browser scraper
    'Überfahrt': {
      type: 'thefork',
      url: 'https://www.thefork.com/restaurant/restaurant-uberfahrt-christian-jurgens-r622837',
      theforkId: 'restaurant-uberfahrt-christian-jurgens-r622837',
    },

    // ❌ No online booking
    'Schwarzwaldstube': {
      type: 'phone_only',
      url: 'https://www.traube-tonbach.de/kulinarik/schwarzwaldstube/',
    },
    'JAN': {
      type: 'phone_only',
      url: 'https://jan-hartwig.com/',
      // Fixed reservation windows: Tue-Fri 18:30-19:00, Fri also 12:00-12:30 & 19:00-19:30
    },
    'Sonnora': {
      type: 'phone_only',
      url: 'https://hotel-sonnora.de/en/',
    },
    'Amador': {
      type: 'email_only',
      url: 'https://en.restaurant-amador.com/reservation/',
    },
    'Silvio Nickol': {
      type: 'phone_only',
      url: 'https://palais-coburg.com/en/culinary/silvio-nickol/',
    },
  }

  const known = KNOWN_CONFIGS[r.name]
  if (known) {
    if (known.type === 'phone_only' || known.type === 'email_only') {
      console.log(`  ⚠️ ${r.name}: ${known.type === 'phone_only' ? 'Phone' : 'Email'} booking only — skipping scraper`)
      return null
    }
    return {
      id: r.id,
      name: r.name,
      ...known,
    } as RestaurantScraperConfig
  }

  // For unknown restaurants, try to auto-detect based on booking_type
  if (r.booking_type === 'formitable' && r.booking_url) {
    const match = r.booking_url.match(/formitable\.com\/.*?([a-f0-9]{8})/)
    if (match) {
      return {
        id: r.id,
        name: r.name,
        type: 'formitable',
        url: r.booking_url,
        formitableSlug: match[1],
      }
    }
  }

  if (r.booking_type === 'opentable' && r.booking_url) {
    const match = r.booking_url.match(/opentable\.com\/r?\/?(.+?)(?:\?|$)/)
    if (match) {
      return {
        id: r.id,
        name: r.name,
        type: 'opentable',
        url: r.booking_url,
        opentableSlug: match[1],
      }
    }
  }

  if (r.booking_type === 'thefork' && r.booking_url) {
    const match = r.booking_url.match(/thefork\.com\/restaurant\/(.+?)(?:\?|$)/)
    if (match) {
      return {
        id: r.id,
        name: r.name,
        type: 'thefork',
        url: r.booking_url,
        theforkId: match[1],
      }
    }
  }

  console.log(`  ⚠️ ${r.name}: No scraper configured — skipping`)
  return null
}
