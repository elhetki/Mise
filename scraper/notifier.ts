import { supabase } from './supabase.js'

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

export async function notifyMatches(matches: Match[]): Promise<void> {
  for (const match of matches) {
    // Create notification in DB
    const { error } = await supabase.from('notifications').insert({
      user_id: match.userId,
      watch_id: match.watchId,
      availability_id: match.availabilityId || null,
      type: 'slot_available',
      title: `🟢 ${match.restaurantName} — Slot available!`,
      body: `${match.date} at ${match.time} for ${match.partySize} ${match.partySize === 1 ? 'person' : 'people'}. Book now before it's gone!`,
    })

    if (error) {
      console.error(`  Failed to create notification for watch ${match.watchId}:`, error.message)
    } else {
      console.log(`  ✅ Notified user ${match.userId} about ${match.restaurantName} on ${match.date} at ${match.time}`)
    }
  }
}
