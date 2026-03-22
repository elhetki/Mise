export interface RestaurantScraperConfig {
  id: string // UUID from restaurants table
  name: string
  type: 'formitable' | 'steirereck' | 'onepagebooking'
  url: string
  // Additional config per type
  formitableSlug?: string
  onepagebookingId?: string
}

// These IDs must match the restaurants table. Query them at startup.
export async function getScraperConfigs(supabase: any): Promise<RestaurantScraperConfig[]> {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, booking_type, booking_url')
    .in('name', ['Rutz', 'Steirereck', 'Schwarzwaldstube'])
    .eq('active', true)

  if (!restaurants) return []

  return restaurants.map((r: any) => {
    if (r.name === 'Rutz') {
      return {
        id: r.id,
        name: r.name,
        type: 'formitable' as const,
        url: r.booking_url || 'https://www.rutz-restaurant.de',
        formitableSlug: 'rutz',
      }
    }
    if (r.name === 'Steirereck') {
      return {
        id: r.id,
        name: r.name,
        type: 'steirereck' as const,
        url: 'https://www.steirereck.at/steirereck-tisch.html',
      }
    }
    if (r.name === 'Schwarzwaldstube') {
      return {
        id: r.id,
        name: r.name,
        type: 'onepagebooking' as const,
        url: 'https://onepagebooking.com/tonbach',
        onepagebookingId: 'tonbach',
      }
    }
    return null
  }).filter(Boolean) as RestaurantScraperConfig[]
}
