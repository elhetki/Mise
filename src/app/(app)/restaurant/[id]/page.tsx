import { createClient } from '@/lib/supabase/server'
import { Restaurant, Availability } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star, ArrowLeft, ExternalLink, CalendarDays, Clock, Users, Zap } from 'lucide-react'
import AddWatchForm from './add-watch-form'

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={16}
          style={{ color: 'var(--gold)', fill: 'var(--gold)' }}
          strokeWidth={0}
        />
      ))}
    </span>
  )
}

function formatDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

interface DayGroup {
  date: string
  slots: Availability[]
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (!restaurant) notFound()

  const r = restaurant as Restaurant

  // Next 30 days of availability
  const today = new Date().toISOString().split('T')[0]
  const thirtyDays = new Date()
  thirtyDays.setDate(thirtyDays.getDate() + 30)
  const future = thirtyDays.toISOString().split('T')[0]

  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('restaurant_id', id)
    .eq('status', 'available')
    .gte('date', today)
    .lte('date', future)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  // Also fetch last checked time
  const { data: lastCheck } = await supabase
    .from('availability')
    .select('checked_at')
    .eq('restaurant_id', id)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single()

  const avail = (availability ?? []) as Availability[]
  const hasAvailable = avail.some(a => a.status === 'available')

  // Group by date
  const byDate = new Map<string, Availability[]>()
  for (const slot of avail) {
    if (!byDate.has(slot.date)) byDate.set(slot.date, [])
    byDate.get(slot.date)!.push(slot)
  }
  const dayGroups: DayGroup[] = Array.from(byDate.entries()).map(([date, slots]) => ({ date, slots }))

  return (
    <div style={{ padding: '24px 16px', maxWidth: 800 }}>
      <style>{`
        @media (min-width: 768px) {
          .restaurant-container { padding: 40px 48px !important; }
          .restaurant-two-col {
            grid-template-columns: 1fr 1fr !important;
          }
          .restaurant-status-row {
            flex-direction: row !important;
          }
          .book-directly-btn {
            width: auto !important;
          }
        }
        .slot-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 100px;
          background: var(--burgundy-bg);
          color: var(--burgundy);
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .day-card {
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--paper-light);
        }
      `}</style>

      {/* Back */}
      <Link
        href="/explore"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 20, paddingLeft: 0, minHeight: 44 }}
      >
        <ArrowLeft size={14} />
        Back to Explore
      </Link>

      {/* Restaurant header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Stars count={r.michelin_stars} />
          <span className="text-caption">{r.michelin_stars} Michelin {r.michelin_stars === 1 ? 'star' : 'stars'}</span>
        </div>

        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 'clamp(26px, 5vw, 36px)',
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.03em',
          marginBottom: 8,
          lineHeight: 1.1,
        }}>
          {r.name}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="text-body" style={{ color: 'var(--ink-3)' }}>{r.city}, {r.country}</span>
          {r.cuisine && (
            <>
              <span style={{ color: 'var(--line-dark)' }}>·</span>
              <span className="text-body" style={{ color: 'var(--ink-3)' }}>{r.cuisine}</span>
            </>
          )}
        </div>
      </div>

      {/* Current availability status */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div
          className="restaurant-status-row"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`status-dot ${hasAvailable ? 'status-dot-available' : 'status-dot-unavailable'}`}
              style={{ width: 10, height: 10, flexShrink: 0 }}
            />
            <div>
              <div style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink)',
              }}>
                {hasAvailable
                  ? `${avail.length} slot${avail.length === 1 ? '' : 's'} available in the next 30 days`
                  : 'No availability found'}
              </div>
              <p className="text-caption">
                {lastCheck?.checked_at
                  ? `Last checked ${timeAgo(lastCheck.checked_at)}`
                  : hasAvailable
                    ? 'Based on recent availability checks'
                    : 'Set a watch to be notified when slots open'}
              </p>
            </div>
          </div>

          {r.booking_url && (
            <a
              href={r.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm book-directly-btn"
              style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
            >
              Book directly
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Two column: watch form + availability */}
      <div
        className="restaurant-two-col"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 16,
        }}
      >
        {/* Start watching form */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}>
            <Zap size={16} style={{ color: 'var(--burgundy)' }} />
            <h2 style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--ink)',
            }}>
              Start watching
            </h2>
          </div>
          <AddWatchForm restaurantId={r.id} />
        </div>

        {/* Availability calendar */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}>
            <CalendarDays size={16} style={{ color: 'var(--ink-3)' }} />
            <h2 style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--ink)',
            }}>
              Available slots (next 30 days)
            </h2>
          </div>

          {dayGroups.length === 0 ? (
            <p className="text-caption" style={{ color: 'var(--ink-4)' }}>
              {lastCheck
                ? 'No open slots found. We check regularly — set a watch to be notified the moment something opens.'
                : 'Not yet scraped. Check back soon.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dayGroups.map(({ date, slots }) => (
                <div key={date} className="day-card">
                  {/* Date header */}
                  <div style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: 8,
                  }}>
                    {formatDate(date)}
                  </div>
                  {/* Time slots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {slots.map((slot) => (
                      <div key={slot.id}>
                        {r.booking_url ? (
                          <a
                            href={r.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="slot-pill"
                            style={{ textDecoration: 'none', cursor: 'pointer' }}
                            title={`Party sizes: ${slot.party_sizes.join(', ')}`}
                          >
                            <Clock size={10} />
                            {slot.time.slice(0, 5)}
                            <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>
                              · {slot.party_sizes.join('/')}p
                            </span>
                          </a>
                        ) : (
                          <span className="slot-pill" title={`Party sizes: ${slot.party_sizes.join(', ')}`}>
                            <Clock size={10} />
                            {slot.time.slice(0, 5)}
                            <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>
                              · {slot.party_sizes.join('/')}p
                            </span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
