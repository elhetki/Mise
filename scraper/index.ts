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
      case 'opentable': {
        const { OpenTableScraper } = await import('./scrapers/opentable')
        return new OpenTableScraper(config).scrape()
      }
      case 'thefork': {
        const { TheForkScraper } = await import('./scrapers/thefork')
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
  console.log(`  ✅ ${result.restaurantName}: Saved ${saved} real availability slots`)
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
