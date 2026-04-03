import { getRestaurantById } from '@/lib/restaurants'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star, ArrowLeft, ExternalLink, Zap, Globe, Clock } from 'lucide-react'
import AddWatchForm from './add-watch-form'
import { BookingPlatform } from '@/types'

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

function BookingPlatformLabel({ platform }: { platform: BookingPlatform }) {
  const map: Record<BookingPlatform, { label: string; url?: string }> = {
    resy:        { label: 'Resy', url: 'https://resy.com' },
    tock:        { label: 'Tock', url: 'https://exploretock.com' },
    sevenrooms:  { label: 'SevenRooms', url: 'https://sevenrooms.com' },
    opentable:   { label: 'OpenTable', url: 'https://opentable.com' },
    thefork:     { label: 'TheFork', url: 'https://thefork.com' },
    direct:      { label: 'Restaurant website' },
    phone:       { label: 'Phone only' },
  }
  return map[platform]
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const restaurant = getRestaurantById(id)

  if (!restaurant) notFound()

  const r = restaurant
  const platformInfo = BookingPlatformLabel({ platform: r.bookingPlatform })

  const statusConfig = {
    available:   { dot: 'status-dot-available',   label: 'Slots open — check the booking platform now' },
    limited:     { dot: 'status-dot-limited',      label: 'Limited availability — act quickly' },
    unavailable: { dot: 'status-dot-unavailable',  label: 'No availability found — we\'re monitoring continuously' },
    unknown:     { dot: 'status-dot-unavailable',  label: 'Availability unknown — set a watch to be notified' },
  }[r.availabilityStatus]

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
        {r.michelinStars > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Stars count={r.michelinStars} />
            <span className="text-caption">
              {r.michelinStars} Michelin {r.michelinStars === 1 ? 'star' : 'stars'}
            </span>
          </div>
        )}

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="text-body" style={{ color: 'var(--ink-3)' }}>
            {r.city}, {r.country}
          </span>
          <span style={{ color: 'var(--line-dark)' }}>·</span>
          <span className="text-body" style={{ color: 'var(--ink-3)' }}>{r.cuisine}</span>
          <span style={{ color: 'var(--line-dark)' }}>·</span>
          <span className="text-body" style={{ color: 'var(--ink-3)' }}>{r.priceRange}</span>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 600 }}>
          {r.description}
        </p>
      </div>

      {/* Availability status */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div
          className="restaurant-status-row"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span
              className={`status-dot ${statusConfig.dot}`}
              style={{ width: 10, height: 10, flexShrink: 0, marginTop: 3 }}
            />
            <div>
              <div style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: 4,
              }}>
                {statusConfig.label}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} style={{ color: 'var(--ink-4)' }} />
                  <span className="text-caption">Typical wait: {r.typicalWait}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Globe size={12} style={{ color: 'var(--ink-4)' }} />
                  <span className="text-caption">Books via {platformInfo.label}</span>
                </div>
              </div>
            </div>
          </div>

          {platformInfo.url && (
            <a
              href={platformInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm book-directly-btn"
              style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
            >
              Check {platformInfo.label}
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Two column: watch form + info */}
      <div
        className="restaurant-two-col"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}
      >
        {/* Start watching form */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Zap size={16} style={{ color: 'var(--burgundy)' }} />
            <h2 style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--ink)',
            }}>
              Watch this restaurant
            </h2>
          </div>
          <p className="text-caption" style={{ color: 'var(--ink-3)', marginBottom: 20 }}>
            Set your dates and party size — we&apos;ll alert you the instant a cancellation opens.
          </p>
          <AddWatchForm restaurantId={r.id} />
        </div>

        {/* Restaurant details */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: 20,
          }}>
            Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'City', value: `${r.city}, ${r.country}` },
              { label: 'Cuisine', value: r.cuisine },
              { label: 'Price range', value: r.priceRange },
              { label: 'Booking platform', value: platformInfo.label },
              { label: 'Typical wait', value: r.typicalWait },
              ...(r.michelinStars > 0
                ? [{ label: 'Michelin stars', value: `${r.michelinStars} ★` }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span className="text-caption" style={{ color: 'var(--ink-4)', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--ink)', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <p className="text-caption" style={{ color: 'var(--ink-4)', lineHeight: 1.6 }}>
              Mise monitors this restaurant continuously. When a cancellation appears for your target date and party size, you&apos;ll receive an instant notification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
