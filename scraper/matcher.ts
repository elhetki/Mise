import { supabase } from './supabase'

interface Match {
  watchId: string
  userId: string
  restaurantId: string
  restaurantName: string
  date: string
  time: string
  partySize: number
  availabilityId: string
}

export async function matchAvailability(): Promise<Match[]> {
  // 1. Get all active watches joined with restaurant names
  const { data: watches } = await supabase
    .from('watches')
    .select('*, restaurant:restaurants(name)')
    .eq('status', 'active')

  if (!watches || watches.length === 0) return []

  // 2. Get recent availability (last 10 min check)
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('status', 'available')
    .gte('checked_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  if (!availability || availability.length === 0) return []

  // 3. Match watches against availability
  const matches: Match[] = []

  for (const watch of watches) {
    for (const slot of availability) {
      if (slot.restaurant_id !== watch.restaurant_id) continue
      if (slot.date < watch.date_from || slot.date > watch.date_to) continue
      if (slot.time < watch.time_from || slot.time > watch.time_to) continue
      if (!slot.party_sizes.includes(watch.party_size)) continue

      // Check if we already notified for this exact slot + watch combo
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('watch_id', watch.id)
        .eq('availability_id', slot.id)
        .limit(1)

      if (existing && existing.length > 0) continue // already notified

      matches.push({
        watchId: watch.id,
        userId: watch.user_id,
        restaurantId: watch.restaurant_id,
        restaurantName: (watch.restaurant as any)?.name || 'Restaurant',
        date: slot.date,
        time: slot.time,
        partySize: watch.party_size,
        availabilityId: slot.id,
      })
    }
  }

  return matches
}
