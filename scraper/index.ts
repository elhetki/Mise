import { getScraperConfigs } from './config'
import { supabase } from './supabase'
import { matchAvailability } from './matcher'
import { notifyMatches } from './notifier'
import type { ScraperResult, AvailabilitySlot } from './scrapers/base'

// Import scrapers dynamically based on type
async function runScraper(config: any): Promise<ScraperResult> {
  try {
    switch (config.type) {
      case 'formitable': {
        const { FormitableScraper } = await import('./scrapers/formitable')
        return new FormitableScraper(config).scrape()
      }
      case 'steirereck': {
        const { SteirereckScraper } = await import('./scrapers/steirereck')
        return new SteirereckScraper(config).scrape()
      }
      case 'onepagebooking': {
        const { OnepagebookingScraper } = await import('./scrapers/onepagebooking')
        return new OnepagebookingScraper(config).scrape()
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
    return
  }

  const simTag = result.simulated ? ' [SIMULATED]' : ''

  // Insert each slot
  const rows = result.slots.map((slot: AvailabilitySlot) => ({
    restaurant_id: result.restaurantId,
    date: slot.date,
    time: slot.time,
    party_sizes: slot.partySizes,
    status: 'available' as const,
    checked_at: result.scrapedAt.toISOString(),
  }))

  const { error } = await supabase.from('availability').insert(rows)
  if (error) {
    console.error(`  DB error for ${result.restaurantName}:`, error.message)
  } else {
    console.log(`  ✅ ${result.restaurantName}: Saved ${rows.length} availability slots${simTag}`)
  }
}

async function main() {
  console.log(`\n🔍 Mise Scraper — ${new Date().toISOString()}`)
  console.log('━'.repeat(50))

  // 1. Get scraper configs
  const configs = await getScraperConfigs(supabase)
  console.log(`Found ${configs.length} restaurants to scrape\n`)

  if (configs.length === 0) {
    console.log('⚠️  No restaurants found. Check Supabase DB — restaurants table must have active=true for Rutz, Steirereck, Schwarzwaldstube')
  }

  // 2. Run all scrapers
  for (const config of configs) {
    console.log(`\nScraping ${config.name}...`)
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
