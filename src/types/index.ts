export type BookingPlatform = 'resy' | 'tock' | 'sevenrooms' | 'opentable' | 'thefork' | 'direct' | 'phone'
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable' | 'unknown'

export interface Restaurant {
  id: string
  name: string
  city: string
  country: string
  cuisine: string
  michelinStars: number
  bookingPlatform: BookingPlatform
  typicalWait: string
  priceRange: string
  description: string
  availabilityStatus: AvailabilityStatus
  imageUrl?: string
}

// ── Supabase DB types (used for watches, bookings, notifications) ──────────

export interface Watch {
  id: string
  user_id: string
  restaurant_id: string
  date_from: string
  date_to: string
  time_from: string
  time_to: string
  party_size: number
  flexibility: 'exact' | 'plus_minus_1' | 'plus_minus_3' | 'any_in_range'
  auto_book: boolean
  status: 'active' | 'paused' | 'fulfilled' | 'expired'
  created_at: string
}

export interface DbRestaurant {
  id: string
  name: string
  city: string
  country: string
  michelin_stars: number
  cuisine: string | null
  booking_type: 'thefork' | 'opentable' | 'resy' | 'website' | 'email' | 'phone'
  booking_url: string | null
  booking_email: string | null
  image_url: string | null
  address: string | null
  lat: number | null
  lng: number | null
  active: boolean
  created_at: string
}

export interface Availability {
  id: string
  restaurant_id: string
  date: string
  time: string
  party_sizes: number[]
  status: 'available' | 'unavailable'
  booking_url: string | null
  checked_at: string
}

export interface Notification {
  id: string
  user_id: string
  watch_id: string
  availability_id: string | null
  type: 'slot_available' | 'auto_booked' | 'watch_expiring' | 'weekly_digest'
  title: string
  body: string
  sent_at: string
  read_at: string | null
  acted_on: boolean
}

export interface Booking {
  id: string
  user_id: string
  restaurant_id: string
  watch_id: string | null
  date: string
  time: string
  party_size: number
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  confirmation_ref: string | null
  notes: string | null
  created_at: string
  // Joined
  restaurant?: DbRestaurant
}
