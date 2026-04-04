/**
 * scraper/config.ts — Restaurant → scraper mapping for Mise
 *
 * All 50 restaurants from src/lib/restaurants.ts are mapped here.
 * IDs match the UUIDs inserted via migration.
 *
 * Booking platforms:
 *   resy     → ResyScraper (22 restaurants)
 *   tock     → TockScraper (9 restaurants)
 *   direct   → no scraper (direct booking via restaurant website)
 *   phone    → no scraper
 *   sevenrooms → no scraper (yet)
 */

export interface RestaurantScraperConfig {
  id: string             // UUID from restaurants table
  name: string
  restaurantSlug: string // slug from restaurants.ts (used as the unique key)
  type: ScraperType
  url: string
  // Resy-specific
  resySlug?: string
  resyCity?: string
  // Tock-specific
  tockSlug?: string
  // Legacy scrapers
  formitableSlug?: string
  alenoKey?: string
  alenoRestaurantId?: string
  opentableSlug?: string
  theforkId?: string
  onepagebookingId?: string
}

export type ScraperType =
  | 'resy'
  | 'tock'
  | 'formitable'
  | 'steirereck'
  | 'onepagebooking'
  | 'opentable'
  | 'thefork'
  | 'phone_only'
  | 'email_only'
  | 'direct_only'

/**
 * Static list of all 50 restaurant configs.
 * The `id` field matches the UUIDs inserted into Supabase.
 */
const STATIC_CONFIGS: RestaurantScraperConfig[] = [
  // ── NYC — Resy ──────────────────────────────────────────────────────────
  {
    id: '11111111-0001-0000-0000-000000000001',
    name: 'Eleven Madison Park',
    restaurantSlug: 'eleven-madison-park',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/eleven-madison-park',
    resySlug: 'eleven-madison-park',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0002-0000-0000-000000000001',
    name: 'Le Bernardin',
    restaurantSlug: 'le-bernardin',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/le-bernardin',
    resySlug: 'le-bernardin',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0007-0000-0000-000000000001',
    name: 'Jungsik',
    restaurantSlug: 'jungsik',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/jungsik',
    resySlug: 'jungsik',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0010-0000-0000-000000000001',
    name: 'Don Angie',
    restaurantSlug: 'don-angie',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/don-angie',
    resySlug: 'don-angie',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0011-0000-0000-000000000001',
    name: '4 Charles Prime Rib',
    restaurantSlug: '4-charles-prime-rib',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/4-charles-prime-rib',
    resySlug: '4-charles-prime-rib',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0012-0000-0000-000000000001',
    name: 'Carbone',
    restaurantSlug: 'carbone',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/carbone-new-york',
    resySlug: 'carbone-new-york',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0014-0000-0000-000000000001',
    name: 'Via Carota',
    restaurantSlug: 'via-carota',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/via-carota',
    resySlug: 'via-carota',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0015-0000-0000-000000000001',
    name: "L'Artusi",
    restaurantSlug: 'lartusi',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/lartusi',
    resySlug: 'lartusi',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0016-0000-0000-000000000001',
    name: 'Tatiana',
    restaurantSlug: 'tatiana',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/tatiana',
    resySlug: 'tatiana',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0017-0000-0000-000000000001',
    name: 'Torrisi',
    restaurantSlug: 'torrisi',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/torrisi-new-york',
    resySlug: 'torrisi-new-york',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0018-0000-0000-000000000001',
    name: 'Le Pavillon',
    restaurantSlug: 'le-pavillon',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/le-pavillon-new-york',
    resySlug: 'le-pavillon-new-york',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0019-0000-0000-000000000001',
    name: 'Daniel',
    restaurantSlug: 'daniel',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/daniel-new-york',
    resySlug: 'daniel-new-york',
    resyCity: 'new-york-city',
  },
  {
    id: '11111111-0020-0000-0000-000000000001',
    name: 'The Four Horsemen',
    restaurantSlug: 'the-four-horsemen',
    type: 'resy',
    url: 'https://resy.com/cities/new-york-city/the-four-horsemen',
    resySlug: 'the-four-horsemen',
    resyCity: 'new-york-city',
  },

  // ── London — Resy ───────────────────────────────────────────────────────
  {
    id: '11111111-0021-0000-0000-000000000001',
    name: 'The Ledbury',
    restaurantSlug: 'the-ledbury',
    type: 'resy',
    url: 'https://resy.com/cities/london/the-ledbury',
    resySlug: 'the-ledbury',
    resyCity: 'london',
  },
  {
    id: '11111111-0024-0000-0000-000000000001',
    name: 'Ikoyi',
    restaurantSlug: 'ikoyi',
    type: 'resy',
    url: 'https://resy.com/cities/london/ikoyi-london',
    resySlug: 'ikoyi-london',
    resyCity: 'london',
  },
  {
    id: '11111111-0025-0000-0000-000000000001',
    name: 'Da Terra',
    restaurantSlug: 'da-terra',
    type: 'resy',
    url: 'https://resy.com/cities/london/da-terra',
    resySlug: 'da-terra',
    resyCity: 'london',
  },
  {
    id: '11111111-0026-0000-0000-000000000001',
    name: 'Kitchen Table',
    restaurantSlug: 'kitchen-table',
    type: 'resy',
    url: 'https://resy.com/cities/london/kitchen-table-london',
    resySlug: 'kitchen-table-london',
    resyCity: 'london',
  },
  {
    id: '11111111-0028-0000-0000-000000000001',
    name: 'Brat',
    restaurantSlug: 'brat',
    type: 'resy',
    url: 'https://resy.com/cities/london/brat-london',
    resySlug: 'brat-london',
    resyCity: 'london',
  },
  {
    id: '11111111-0029-0000-0000-000000000001',
    name: 'The Clove Club',
    restaurantSlug: 'the-clove-club',
    type: 'resy',
    url: 'https://resy.com/cities/london/the-clove-club',
    resySlug: 'the-clove-club',
    resyCity: 'london',
  },
  {
    id: '11111111-0030-0000-0000-000000000001',
    name: "Lyle's",
    restaurantSlug: 'lyles',
    type: 'resy',
    url: 'https://resy.com/cities/london/lyles-london',
    resySlug: 'lyles-london',
    resyCity: 'london',
  },
  {
    id: '11111111-0034-0000-0000-000000000001',
    name: 'Noble Rot Soho',
    restaurantSlug: 'noble-rot-soho',
    type: 'resy',
    url: 'https://resy.com/cities/london/noble-rot-london',
    resySlug: 'noble-rot-london',
    resyCity: 'london',
  },

  // ── NYC — Tock ──────────────────────────────────────────────────────────
  {
    id: '11111111-0004-0000-0000-000000000001',
    name: 'Per Se',
    restaurantSlug: 'per-se',
    type: 'tock',
    url: 'https://www.exploretock.com/perse',
    tockSlug: 'perse',
  },
  {
    id: '11111111-0005-0000-0000-000000000001',
    name: "Chef's Table at Brooklyn Fare",
    restaurantSlug: 'chefs-table-brooklyn-fare',
    type: 'tock',
    url: 'https://www.exploretock.com/chefsatbrooklynfare',
    tockSlug: 'chefsatbrooklynfare',
  },
  {
    id: '11111111-0006-0000-0000-000000000001',
    name: 'Atomix',
    restaurantSlug: 'atomix',
    type: 'tock',
    url: 'https://www.exploretock.com/atomix',
    tockSlug: 'atomix',
  },
  {
    id: '11111111-0008-0000-0000-000000000001',
    name: 'Odo',
    restaurantSlug: 'odo',
    type: 'tock',
    url: 'https://www.exploretock.com/odo',
    tockSlug: 'odo',
  },
  {
    id: '11111111-0009-0000-0000-000000000001',
    name: "The Chef's Counter at Noda",
    restaurantSlug: 'chefs-counter-noda',
    type: 'tock',
    url: 'https://www.exploretock.com/noda',
    tockSlug: 'noda',
  },

  // ── World — Tock ────────────────────────────────────────────────────────
  {
    id: '11111111-0045-0000-0000-000000000001',
    name: 'Pujol',
    restaurantSlug: 'pujol',
    type: 'tock',
    url: 'https://www.exploretock.com/pujol',
    tockSlug: 'pujol',
  },
  {
    id: '11111111-0046-0000-0000-000000000001',
    name: 'Geranium',
    restaurantSlug: 'geranium',
    type: 'tock',
    url: 'https://www.exploretock.com/geranium',
    tockSlug: 'geranium',
  },
  {
    id: '11111111-0047-0000-0000-000000000001',
    name: 'Alchemist',
    restaurantSlug: 'alchemist',
    type: 'tock',
    url: 'https://www.exploretock.com/alchemist-copenhagen',
    tockSlug: 'alchemist-copenhagen',
  },
  {
    id: '11111111-0048-0000-0000-000000000001',
    name: 'Frantzén',
    restaurantSlug: 'frantzen',
    type: 'tock',
    url: 'https://www.exploretock.com/frantzen',
    tockSlug: 'frantzen',
  },
  {
    id: '11111111-0049-0000-0000-000000000001',
    name: 'DiverXO',
    restaurantSlug: 'diverxo',
    type: 'tock',
    url: 'https://www.exploretock.com/diverxo',
    tockSlug: 'diverxo',
  },

  // ── No scraper — phone only ──────────────────────────────────────────────
  {
    id: '11111111-0003-0000-0000-000000000001',
    name: 'Masa',
    restaurantSlug: 'masa',
    type: 'phone_only',
    url: 'https://www.masanyc.com/',
  },
  {
    id: '11111111-0013-0000-0000-000000000001',
    name: 'I Sodi',
    restaurantSlug: 'i-sodi',
    type: 'phone_only',
    url: 'https://www.isodinyc.com/',
  },
  {
    id: '11111111-0033-0000-0000-000000000001',
    name: 'River Café',
    restaurantSlug: 'river-cafe',
    type: 'phone_only',
    url: 'https://www.rivercafe.co.uk/',
  },
  {
    id: '11111111-0050-0000-0000-000000000001',
    name: 'Asador Etxebarri',
    restaurantSlug: 'asador-etxebarri',
    type: 'phone_only',
    url: 'https://asadoretxebarri.com/',
  },

  // ── No scraper — direct booking ──────────────────────────────────────────
  {
    id: '11111111-0022-0000-0000-000000000001',
    name: 'Sketch (Lecture Room)',
    restaurantSlug: 'sketch-lecture-room',
    type: 'direct_only',
    url: 'https://www.sketch.london/',
  },
  {
    id: '11111111-0023-0000-0000-000000000001',
    name: 'Core by Clare Smyth',
    restaurantSlug: 'core-by-clare-smyth',
    type: 'direct_only',
    url: 'https://www.corebyclaresmyth.com/',
  },
  {
    id: '11111111-0027-0000-0000-000000000001',
    name: 'A. Wong',
    restaurantSlug: 'a-wong',
    type: 'direct_only',
    url: 'https://www.awong.co.uk/',
  },
  {
    id: '11111111-0031-0000-0000-000000000001',
    name: 'St. John',
    restaurantSlug: 'st-john',
    type: 'direct_only',
    url: 'https://stjohnrestaurant.com/',
  },
  {
    id: '11111111-0032-0000-0000-000000000001',
    name: 'Rochelle Canteen',
    restaurantSlug: 'rochelle-canteen',
    type: 'direct_only',
    url: 'https://arnoldandhenderson.com/rochelle-canteen/',
  },
  {
    id: '11111111-0035-0000-0000-000000000001',
    name: "Brat x Climpson's Arch",
    restaurantSlug: 'brat-shoreditch-roof',
    type: 'direct_only',
    url: 'https://bratrestaurant.com/',
  },
  {
    id: '11111111-0036-0000-0000-000000000001',
    name: 'Noma',
    restaurantSlug: 'noma',
    type: 'direct_only',
    url: 'https://noma.dk/',
  },
  {
    id: '11111111-0037-0000-0000-000000000001',
    name: 'Osteria Francescana',
    restaurantSlug: 'osteria-francescana',
    type: 'direct_only',
    url: 'https://www.osteriafrancescana.it/',
  },
  {
    id: '11111111-0038-0000-0000-000000000001',
    name: 'Mirazur',
    restaurantSlug: 'mirazur',
    type: 'direct_only',
    url: 'https://www.mirazur.fr/',
  },
  {
    id: '11111111-0039-0000-0000-000000000001',
    name: 'Central',
    restaurantSlug: 'central',
    type: 'direct_only',
    url: 'https://centralrestaurante.com.pe/',
  },
  {
    id: '11111111-0040-0000-0000-000000000001',
    name: 'Gaggan',
    restaurantSlug: 'gaggan',
    type: 'direct_only',
    url: 'https://www.eatatgaggan.com/',
  },
  {
    id: '11111111-0041-0000-0000-000000000001',
    name: 'Den',
    restaurantSlug: 'den-tokyo',
    type: 'direct_only',
    url: 'https://www.jimbochoden.com/',
  },
  {
    id: '11111111-0042-0000-0000-000000000001',
    name: 'Florilège',
    restaurantSlug: 'florilege',
    type: 'direct_only',
    url: 'https://www.florilegetokyo.com/',
  },
  {
    id: '11111111-0043-0000-0000-000000000001',
    name: 'Narisawa',
    restaurantSlug: 'narisawa',
    type: 'direct_only',
    url: 'https://www.narisawa-yoshihiro.com/',
  },
  {
    id: '11111111-0044-0000-0000-000000000001',
    name: 'Quintonil',
    restaurantSlug: 'quintonil',
    type: 'direct_only',
    url: 'https://www.quintonil.com/',
  },
]

/**
 * Returns only the configs that have an active scraper (resy or tock).
 * Logs skipped restaurants.
 */
export function getScrapableConfigs(): RestaurantScraperConfig[] {
  return STATIC_CONFIGS.filter(c => {
    if (c.type === 'phone_only' || c.type === 'email_only' || c.type === 'direct_only') {
      return false
    }
    return true
  })
}

/**
 * Returns ALL configs (used for reporting).
 */
export function getAllConfigs(): RestaurantScraperConfig[] {
  return STATIC_CONFIGS
}

/**
 * Legacy: kept for compatibility with existing index.ts signature.
 * Returns scrapable configs without needing Supabase.
 */
export async function getScraperConfigs(_supabase?: unknown): Promise<RestaurantScraperConfig[]> {
  return getScrapableConfigs()
}
