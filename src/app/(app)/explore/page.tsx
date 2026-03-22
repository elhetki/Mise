import { createClient } from '@/lib/supabase/server'
import { Restaurant } from '@/types'
import Link from 'next/link'
import { Star, Search, Clock } from 'lucide-react'

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={11}
          style={{ color: 'var(--gold)', fill: 'var(--gold)' }}
          strokeWidth={0}
        />
      ))}
    </span>
  )
}

function BookingBadge({ type }: { type: Restaurant['booking_type'] }) {
  const labels: Record<Restaurant['booking_type'], string> = {
    thefork: 'TheFork',
    opentable: 'OpenTable',
    resy: 'Resy',
    website: 'Website',
    email: 'Email',
    phone: 'Phone',
  }
  return <span className="badge">{labels[type]}</span>
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

interface AvailabilitySummary {
  restaurant_id: string
  slot_count: number
  last_checked: string
  has_available: boolean
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('restaurants')
    .select('*')
    .eq('active', true)
    .order('michelin_stars', { ascending: false })
    .order('name')

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,cuisine.ilike.%${q}%`)
  }

  const { data: restaurants } = await query
  const typed = (restaurants ?? []) as Restaurant[]

  // Fetch availability summary for next 30 days per restaurant
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const today = new Date().toISOString().split('T')[0]
  const future = thirtyDaysFromNow.toISOString().split('T')[0]

  const restaurantIds = typed.map(r => r.id)
  const availabilityMap = new Map<string, AvailabilitySummary>()

  if (restaurantIds.length > 0) {
    // Get latest check time and available count per restaurant
    const { data: availData } = await supabase
      .from('availability')
      .select('restaurant_id, status, checked_at')
      .in('restaurant_id', restaurantIds)
      .gte('date', today)
      .lte('date', future)
      .order('checked_at', { ascending: false })

    if (availData) {
      // Group by restaurant_id
      for (const row of availData) {
        const existing = availabilityMap.get(row.restaurant_id)
        if (!existing) {
          availabilityMap.set(row.restaurant_id, {
            restaurant_id: row.restaurant_id,
            slot_count: row.status === 'available' ? 1 : 0,
            last_checked: row.checked_at,
            has_available: row.status === 'available',
          })
        } else {
          if (row.status === 'available') {
            existing.slot_count++
            existing.has_available = true
          }
          // already sorted by checked_at desc so first entry is latest
        }
      }
    }
  }

  return (
    <div style={{ padding: '28px 16px' }}>
      <style>{`
        @media (min-width: 768px) {
          .explore-container { padding: 40px 48px !important; }
          .restaurant-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
          }
        }
        .restaurant-card-link:hover .restaurant-card {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.025em',
          marginBottom: 4,
        }}>
          Explore
        </h1>
        <p className="text-body" style={{ color: 'var(--ink-3)' }}>
          {typed.length} Michelin-starred restaurants
        </p>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 28, position: 'relative', maxWidth: 480 }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--ink-4)',
            pointerEvents: 'none',
          }}
        />
        <input
          name="q"
          type="search"
          className="input"
          defaultValue={q ?? ''}
          placeholder="Search by name, city, or cuisine…"
          style={{ paddingLeft: 36, minHeight: 44, width: '100%' }}
        />
      </form>

      {/* Grid */}
      {typed.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px' }}>
          <p className="text-body" style={{ color: 'var(--ink-3)' }}>
            No restaurants found{q ? ` for "${q}"` : ''}.
          </p>
        </div>
      ) : (
        <div
          className="restaurant-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 16,
          }}
        >
          {typed.map((r) => {
            const avail = availabilityMap.get(r.id)
            return (
              <Link
                key={r.id}
                href={`/restaurant/${r.id}`}
                className="restaurant-card-link"
                style={{
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div
                  className="card restaurant-card"
                  style={{
                    padding: 20,
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                >
                  {/* Stars row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}>
                    <Stars count={r.michelin_stars} />
                    <BookingBadge type={r.booking_type} />
                  </div>

                  {/* Name */}
                  <h3 style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 17,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    letterSpacing: '-0.015em',
                    marginBottom: 4,
                    lineHeight: 1.2,
                  }}>
                    {r.name}
                  </h3>

                  {/* City + cuisine */}
                  <p className="text-caption" style={{ marginBottom: 14 }}>
                    {r.city}{r.cuisine ? ` · ${r.cuisine}` : ''}
                  </p>

                  {/* Availability status + last checked */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-dot ${avail?.has_available ? 'status-dot-available' : 'status-dot-unavailable'}`} />
                      <span className="text-caption">
                        {avail?.has_available
                          ? `${avail.slot_count} slot${avail.slot_count === 1 ? '' : 's'} available`
                          : 'No slots found'}
                      </span>
                    </div>
                    {avail?.last_checked && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} style={{ color: 'var(--ink-4)' }} />
                        <span className="text-caption" style={{ color: 'var(--ink-4)' }}>
                          {timeAgo(avail.last_checked)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
