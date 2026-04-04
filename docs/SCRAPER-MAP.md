# Scraper Map — All 50 Restaurants

*Last researched: 2026-04-04*

## How Each Platform Works

### Resy (13 restaurants)
- API: `api.resy.com` — public, no auth for availability checks
- Step 1: GET `https://api.resy.com/3/venue?url_slug={slug}&location={city}` → get venue_id
- Step 2: GET `https://api.resy.com/4/find?lat=0&long=0&day={YYYY-MM-DD}&party_size={n}&venue_id={id}`
- Headers: `Authorization: ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"`, `X-Origin: https://resy.com`
- London Resy: UK shard, different API — use SevenRooms or simulate
- Direct HTTP, no browser needed ✅

### Tock (exploretock.com)
- Noma, Quintonil use it — slug format: `exploretock.com/{slug}`
- API: needs browser/Playwright (Cloudflare blocks direct API calls)
- Approach: Load `exploretock.com/{slug}` with Playwright, pick date, extract timeslots from DOM

### SevenRooms
- Ikoyi: `sevenrooms.com/widget/embed.js` + venue slug `ikoyilondon`
- Noble Rot Soho: slug `noblerotsoho`
- API: `https://api.sevenrooms.com/2_4/availability` (documented public widget API)
- Headers: no auth needed for availability widget

### Formitable/Zenchef
- Geranium Copenhagen: uses formitable.com SDK
- Already working (Rutz example) — need Geranium's restaurant UID

### OpenTable
- The Ledbury: `opentable.co.uk/the-ledbury` ✅ confirmed
- St. John: uses OpenTable
- Browser-based scraper already exists in `scraper/scrapers/opentable.ts`

### CoverManager
- DiverXO Madrid: uses CoverManager (Spanish restaurant booking system)
- API: `api.covermanager.com/restaurants/{id}/availability`

### Phone/Email Only (no scraper possible)
- Masa NYC, I Sodi, River Café, Asador Etxebarri
- Osteria Francescana, Mirazur, Central Lima, Gaggan, Den, Florilège, Narisawa

## Full Restaurant Map

| Restaurant | City | Platform | Scraper | Config |
|-----------|------|----------|---------|--------|
| Eleven Madison Park | NYC | Resy | ResyScraper | slug: eleven-madison-park, city: new-york-city |
| Le Bernardin | NYC | Resy | ResyScraper | slug: le-bernardin, city: new-york-city |
| Per Se | NYC | Tock | TockScraper | slug: per-se (NOTE: may be tock) |
| Atomix | NYC | Tock | TockScraper | slug: atomix-nyc |
| Jungsik | NYC | Resy | ResyScraper | slug: jungsik, city: new-york-city |
| Odo | NYC | Tock | TockScraper | slug: odo-nyc |
| 4 Charles Prime Rib | NYC | Resy | ResyScraper | venue_id: 1505 (known) |
| Don Angie | NYC | Resy | ResyScraper | slug: don-angie, city: new-york-city |
| Carbone | NYC | Resy | ResyScraper | venue_id: 1505 (look up) |
| Via Carota | NYC | Resy | ResyScraper | slug: via-carota, city: new-york-city |
| L'Artusi | NYC | Resy | ResyScraper | slug: lartusi, city: new-york-city |
| Tatiana | NYC | Resy | ResyScraper | slug: tatiana-nyc, city: new-york-city |
| Torrisi | NYC | Resy | ResyScraper | slug: torrisi-new-york, city: new-york-city |
| Le Pavillon | NYC | Resy | ResyScraper | slug: le-pavillon-new-york, city: new-york-city |
| Daniel | NYC | Resy | ResyScraper | slug: daniel-new-york, city: new-york-city |
| The Four Horsemen | NYC | Resy | ResyScraper | slug: the-four-horsemen, city: new-york-city |
| Masa | NYC | Phone | SKIP | - |
| I Sodi | NYC | Phone | SKIP | - |
| Chef's Table at Brooklyn Fare | NYC | Direct/email | SKIP | - |
| The Chef's Counter at Noda | NYC | Direct | simulate | - |
| The Ledbury | London | OpenTable | OpenTableScraper | slug: the-ledbury |
| Sketch | London | Direct | simulate | complex own system |
| Core by Clare Smyth | London | Tock | TockScraper | slug: core-by-clare-smyth |
| Ikoyi | London | SevenRooms | SevenRoomsScraper | venue: ikoyilondon |
| Da Terra | London | SevenRooms | SevenRoomsScraper | need to verify slug |
| Kitchen Table | London | Resy | ResyScraper | slug: kitchen-table-london, city: london (UK shard — simulate fallback) |
| A. Wong | London | SevenRooms | SevenRoomsScraper | venue: awong |
| Brat | London | Direct | simulate | own system (no known API) |
| The Clove Club | London | OpenTable | OpenTableScraper | slug: the-clove-club-london |
| Lyle's | London | Direct | simulate | - |
| St. John | London | OpenTable | OpenTableScraper | slug: st-john-restaurant-london |
| Rochelle Canteen | London | Direct | simulate | - |
| Noble Rot Soho | London | SevenRooms | SevenRoomsScraper | venue: noblerotsoho |
| Noma | Copenhagen | Tock | TockScraper | slug: noma |
| Geranium | Copenhagen | Formitable | FormitableScraper | need UID (research) |
| Alchemist | Copenhagen | Direct | simulate | own ticketing system |
| Osteria Francescana | Modena | Phone/email | SKIP | - |
| Mirazur | Menton | Direct/Booking | simulate | - |
| Frantzén | Stockholm | Direct | simulate | own system |
| DiverXO | Madrid | CoverManager | simulate | covermanager |
| Central | Lima | Direct | SKIP | - |
| Gaggan | Bangkok | Direct | SKIP | - |
| Den | Tokyo | Direct | SKIP | - |
| Florilège | Tokyo | Direct | SKIP | - |
| Narisawa | Tokyo | Direct | SKIP | - |
| Quintonil | Mexico City | Tock | TockScraper | slug: quintonil |
| Pujol | Mexico City | Tock | TockScraper | slug: pujol |
| Asador Etxebarri | Atxondo | Phone | SKIP | - |

## SevenRooms API
```
GET https://api.sevenrooms.com/2_4/availability
Params: venue_group_id={venue}, date={YYYY-MM-DD}, party_size={n}, channel=SEVENROOMS_WIDGET
No auth needed for widget requests
```
