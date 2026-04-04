import { createClient } from '@/lib/supabase/server'
import { RESTAURANTS } from '@/lib/restaurants'
import { AvailabilityStatus } from '@/types'
import ExploreClient from './explore-client'

// Fetch real availability_status from Supabase and merge with static restaurant data
export default async function ExplorePage() {
  // Build a slug → status map from DB
  const statusMap: Record<string, AvailabilityStatus> = {}

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('restaurants')
      .select('slug, availability_status')
      .not('slug', 'is', null)

    if (data) {
      for (const row of data) {
        if (row.slug && row.availability_status) {
          statusMap[row.slug] = row.availability_status as AvailabilityStatus
        }
      }
    }
  } catch (_err) {
    // Fall through to static data
  }

  // Merge live status into static restaurant list
  const restaurants = RESTAURANTS.map(r => ({
    ...r,
    availabilityStatus: statusMap[r.id] ?? r.availabilityStatus,
  }))

  return <ExploreClient restaurants={restaurants} />
}
