import { createClient } from '@/lib/supabase/server'
import { Watch, Restaurant } from '@/types'
import Link from 'next/link'
import { Star, Plus, Eye } from 'lucide-react'

type WatchWithRestaurant = Watch & { restaurant: Restaurant }

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

function StatusDot({ status }: { status: Watch['status'] }) {
  if (status === 'active') return <span className="status-dot status-dot-available" />
  if (status === 'paused') return <span className="status-dot status-dot-limited" />
  return <span className="status-dot status-dot-unavailable" />
}

function StatusLabel({ status }: { status: Watch['status'] }) {
  const labels: Record<Watch['status'], string> = {
    active: 'Watching',
    paused: 'Paused',
    fulfilled: 'Booked',
    expired: 'Expired',
  }
  return <span className="text-caption">{labels[status]}</span>
}

function formatDateRange(from: string, to: string) {
  const fmt = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(from)} – ${fmt(to)}`
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default async function WatchlistPage() {
  const supabase = await createClient()

  const { data: watches } = await supabase
    .from('watches')
    .select('*, restaurant:restaurants(*)')
    .order('created_at', { ascending: false })

  const typedWatches = (watches ?? []) as WatchWithRestaurant[]

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.025em',
            marginBottom: 4,
          }}>
            My Watchlist
          </h1>
          <p className="text-body" style={{ color: 'var(--ink-3)' }}>
            {typedWatches.length > 0
              ? `${typedWatches.filter(w => w.status === 'active').length} active watches`
              : 'No restaurants tracked yet'}
          </p>
        </div>

        <Link href="/explore" className="btn btn-primary" style={{ gap: 6 }}>
          <Plus size={15} />
          Add watch
        </Link>
      </div>

      {/* Empty state */}
      {typedWatches.length === 0 && (
        <div className="card" style={{
          padding: '64px 48px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--burgundy-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}>
            <Eye size={22} style={{ color: 'var(--burgundy)' }} />
          </div>
          <h2 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--ink)',
          }}>
            No watches yet
          </h2>
          <p className="text-body" style={{ color: 'var(--ink-3)', maxWidth: 320 }}>
            Start tracking a restaurant and we&apos;ll alert you the moment a table opens up.
          </p>
          <Link href="/explore" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
            Explore restaurants
          </Link>
        </div>
      )}

      {/* Watch cards */}
      {typedWatches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {typedWatches.map((watch) => (
            <div key={watch.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
              }}>
                {/* Left: restaurant info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}>
                    <h3 style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}>
                      {watch.restaurant?.name ?? 'Unknown restaurant'}
                    </h3>
                    {watch.restaurant && (
                      <Stars count={watch.restaurant.michelin_stars} />
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}>
                    <span className="text-caption">
                      {watch.restaurant?.city}
                    </span>
                    <span className="text-caption">
                      {formatDateRange(watch.date_from, watch.date_to)}
                    </span>
                    <span className="text-caption">
                      {formatTime(watch.time_from)} – {formatTime(watch.time_to)}
                    </span>
                    <span className="text-caption">
                      {watch.party_size} {watch.party_size === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                </div>

                {/* Right: status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <StatusDot status={watch.status} />
                  <StatusLabel status={watch.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
