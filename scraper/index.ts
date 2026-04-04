// Load .env.local for local scraper runs
import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'
dotenvConfig({ path: resolve(process.cwd(), '.env.local') })

import { getScrapableConfigs } from './config.js'
import { supabase } from './supabase.js'
import { matchAvailability } from './matcher.js'
import { notifyMatches } from './notifier.js'
import type { ScraperResult, AvailabilitySlot } from './scrapers/base.js'
import type { RestaurantScraperConfig } from './config.js'

// Import scrapers dynamically based on type
async function runScraper(config: RestaurantScraperConfig): Promise<ScraperResult> {
  try {
    switch (config.type) {
      case 'resy': {
        const { ResyScraper } = await import('./scrapers/resy.js')
        return new ResyScraper(config).scrape()
      }
      case 'tock': {
        const { TockScraper } = await import('./scrapers/tock.js')
        return new TockScraper(config).scrape()
      }
      case 'formitable': {
        const { FormitableScraper } = await import('./scrapers/formitable.js')
        return new FormitableScraper(config).scrape()
      }
      case 'steirereck': {
        const { SteirereckScraper } = await import('./scrapers/steirereck.js')
        return new SteirereckScraper(config).scrape()
      }
      case 'onepagebooking': {
        const { OnepagebookingScraper } = await import('./scrapers/onepagebooking.js')
        return new OnepagebookingScraper(config).scrape()
      }
      case 'sevenrooms': {
        const { SevenRoomsScraper } = await import('./scrapers/sevenrooms.js')
        return new SevenRoomsScraper(config).scrape()
      }
      case 'opentable': {
        const { OpenTableScraper } = await import('./scrapers/opentable.js')
        return new OpenTableScraper(config).scrape()
      }
      case 'thefork': {
        const { TheForkScraper } = await import('./scrapers/thefork.js')
        return new TheForkScraper(config).scrape()
      }
      default:
        return {
          restaurantId: config.id,
          restaurantName: config.name,
          slots: [],
          scrapedAt: new Date(),
          error: `Unknown scraper type: ${config.type}`,
        }
    }
  } catch (err) {
    return {
      restaurantId: config.id,
      restaurantName: config.name,
      slots: [],
      scrapedAt: new Date(),
      error: String(err),
    }
  }
}

async function saveAvailability(result: ScraperResult): Promise<void> {
  if (result.error && result.slots.length === 0) {
    console.error(`  ⚠️ ${result.restaurantName}: ${result.error}`)
    return
  }

  if (result.slots.length === 0) {
    console.log(`  📋 ${result.restaurantName}: No availability found`)
    // Update availability_status to 'unavailable' in restaurants table
    await updateAvailabilityStatus(result.restaurantId, 'unavailable')
    return
  }

  // Upsert each slot (avoid duplicates on re-runs)
  const rows = result.slots.map((slot: AvailabilitySlot) => ({
    restaurant_id: result.restaurantId,
    date: slot.date,
    time: slot.time,
    party_sizes: slot.partySizes,
    status: 'available' as const,
    checked_at: result.scrapedAt.toISOString(),
  }))

  // Insert in batches of 50 to avoid payload limits
  let saved = 0
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const { error } = await supabase
      .from('availability')
      .upsert(batch, { onConflict: 'restaurant_id,date,time' })
    if (error) {
      console.error(`  DB error for ${result.restaurantName}:`, error.message)
    } else {
      saved += batch.length
    }
  }

  // Determine availability status based on slots
  const hasNearTermSlots = result.slots.some(s => {
    const slotDate = new Date(s.date)
    const daysAway = Math.ceil((slotDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysAway <= 14
  })

  const status = hasNearTermSlots ? 'available' : 'limited'
  await updateAvailabilityStatus(result.restaurantId, status)

  const simFlag = result.simulated ? ' (simulated)' : ''
  console.log(`  ✅ ${result.restaurantName}: Saved ${saved} slots, status=${status}${simFlag}`)
}

async function updateAvailabilityStatus(
  restaurantId: string,
  status: 'available' | 'limited' | 'unavailable'
): Promise<void> {
  const { error } = await supabase
    .from('restaurants')
    .update({ availability_status: status })
    .eq('id', restaurantId)

  if (error) {
    console.error(`  DB error updating status for ${restaurantId}:`, error.message)
  }
}

async function main() {
  console.log(`\n🔍 Mise Scraper — ${new Date().toISOString()}`)
  console.log('━'.repeat(50))

  // 1. Get scraper configs (static, no DB needed)
  const configs = getScrapableConfigs()
  console.log(`Found ${configs.length} restaurants to scrape`)

  const resyConfigs = configs.filter(c => c.type === 'resy')
  const tockConfigs = configs.filter(c => c.type === 'tock')
  const otherConfigs = configs.filter(c => c.type !== 'resy' && c.type !== 'tock')

  console.log(`  → ${resyConfigs.length} Resy, ${tockConfigs.length} Tock, ${otherConfigs.length} other\n`)

  // 2. Run all scrapers sequentially (respect rate limits)
  for (const config of configs) {
    console.log(`\nScraping ${config.name} (${config.type})...`)
    const result = await runScraper(config)
    await saveAvailability(result)
  }

  // 3. Match availability against watches
  console.log('\n🔄 Matching availability against watches...')
  const matches = await matchAvailability()
  console.log(`Found ${matches.length} matches`)

  // 4. Send notifications
  if (matches.length > 0) {
    console.log('\n📬 Sending notifications...')
    await notifyMatches(matches)
  }

  console.log('\n✅ Scraper run complete\n')
}

main().catch(console.error)
