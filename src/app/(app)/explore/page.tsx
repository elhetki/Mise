import { createClient } from '@/lib/supabase/server'
import { Restaurant } from '@/types'
import Link from 'next/link'
import { Star, Search } from 'lucide-react'

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

// Subtle rotation for personality — alternates between a few values
const ROTATIONS = ['-0.3deg', '0.2deg', '-0.1deg', '0.3deg', '-0.2deg', '0.1deg']

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

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 28,
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
      <form method="GET" style={{ marginBottom: 36, maxWidth: 440, position: 'relative' }}>
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
          style={{ paddingLeft: 36 }}
        />
      </form>

      {/* Grid */}
      {typed.length === 0 ? (
        <div className="card" style={{ padding: '48px 32px' }}>
          <p className="text-body" style={{ color: 'var(--ink-3)' }}>
            No restaurants found{q ? ` for "${q}"` : ''}.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {typed.map((r, i) => (
            <Link
              key={r.id}
              href={`/restaurant/${r.id}`}
              style={{
                textDecoration: 'none',
                display: 'block',
                transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              className="card-link-wrapper"
            >
              <div className="card" style={{ padding: 20 }}>
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

                {/* Status indicator (placeholder — no live data yet) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="status-dot status-dot-unavailable" />
                  <span className="text-caption">Tracking</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
