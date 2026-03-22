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
  return new Date(s).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
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

  // Last 7 days of availability
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('restaurant_id', id)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .order('time', { ascending: true })
    .limit(30)

  const avail = (availability ?? []) as Availability[]
  const hasAvailable = avail.some(a => a.status === 'available')

  return (
    <div style={{ padding: '40px 48px', maxWidth: 800 }}>
      {/* Back */}
      <Link
        href="/explore"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 24, paddingLeft: 0 }}
      >
        <ArrowLeft size={14} />
        Back to Explore
      </Link>

      {/* Restaurant header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Stars count={r.michelin_stars} />
          <span className="text-caption">{r.michelin_stars} Michelin {r.michelin_stars === 1 ? 'star' : 'stars'}</span>
        </div>

        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 36,
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
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`status-dot ${hasAvailable ? 'status-dot-available' : 'status-dot-unavailable'}`}
              style={{ width: 10, height: 10 }}
            />
            <div>
              <div style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink)',
              }}>
                {hasAvailable ? 'Tables available' : 'No availability found'}
              </div>
              <p className="text-caption">
                {hasAvailable
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
              className="btn btn-secondary btn-sm"
            >
              Book directly
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Two column: watch form + history */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Start watching form */}
        <div className="card" style={{ padding: '24px' }}>
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

        {/* Availability history */}
        <div className="card" style={{ padding: '24px' }}>
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
              Last 7 days
            </h2>
          </div>

          {avail.length === 0 ? (
            <p className="text-caption" style={{ color: 'var(--ink-4)' }}>
              No availability data yet for this restaurant.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {avail.map((a) => (
                <div key={a.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--line)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`status-dot ${a.status === 'available' ? 'status-dot-available' : 'status-dot-unavailable'}`} />
                    <span className="text-caption">{formatDate(a.date)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={11} style={{ color: 'var(--ink-4)' }} />
                    <span className="text-caption">{a.time.slice(0, 5)}</span>
                    <Users size={11} style={{ color: 'var(--ink-4)' }} />
                    <span className="text-caption tabular-nums">{a.party_sizes.join(', ')}</span>
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
