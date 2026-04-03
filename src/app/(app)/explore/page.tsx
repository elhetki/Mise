'use client'

import { useState, useMemo } from 'react'
import { Restaurant, BookingPlatform, AvailabilityStatus } from '@/types'
import { RESTAURANTS, BOOKING_PLATFORMS } from '@/lib/restaurants'
import Link from 'next/link'
import { Star, Search, Globe } from 'lucide-react'

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

function BookingBadge({ platform }: { platform: BookingPlatform }) {
  const labels: Record<BookingPlatform, string> = {
    resy: 'Resy',
    tock: 'Tock',
    sevenrooms: 'SevenRooms',
    opentable: 'OpenTable',
    thefork: 'TheFork',
    direct: 'Direct',
    phone: 'Phone',
  }
  return <span className="badge">{labels[platform]}</span>
}

function AvailabilityPill({ status }: { status: AvailabilityStatus }) {
  const config: Record<AvailabilityStatus, { dot: string; label: string }> = {
    available:   { dot: 'status-dot-available',   label: 'Slots open' },
    limited:     { dot: 'status-dot-limited',      label: 'Limited' },
    unavailable: { dot: 'status-dot-unavailable',  label: 'Tracking' },
    unknown:     { dot: 'status-dot-unavailable',  label: 'Unknown' },
  }
  const c = config[status]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className={`status-dot ${c.dot}`} />
      <span className="text-caption">{c.label}</span>
    </div>
  )
}

// Derive unique cities from the data
const ALL_CITIES = Array.from(new Set(RESTAURANTS.map(r => r.city))).sort()

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const filtered = useMemo(() => {
    return RESTAURANTS.filter(r => {
      if (selectedCity !== 'all' && r.city !== selectedCity) return false
      if (selectedPlatform !== 'all' && r.bookingPlatform !== selectedPlatform) return false
      if (selectedStatus !== 'all' && r.availabilityStatus !== selectedStatus) return false
      if (query) {
        const q = query.toLowerCase()
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.city.toLowerCase().includes(q) &&
          !r.cuisine.toLowerCase().includes(q) &&
          !r.country.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [query, selectedCity, selectedPlatform, selectedStatus])

  const hasFilters = selectedCity !== 'all' || selectedPlatform !== 'all' || selectedStatus !== 'all' || query

  return (
    <div style={{ padding: '28px 16px' }}>
      <style>{`
        @media (min-width: 768px) {
          .explore-container { padding: 40px 48px !important; }
          .restaurant-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
          }
          .explore-filters {
            flex-direction: row !important;
            flex-wrap: wrap !important;
          }
        }
        .restaurant-card-link:hover .restaurant-card {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }
        .filter-select {
          background: var(--paper-light);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--ink);
          min-height: 38px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 30px;
        }
        .filter-select:focus {
          outline: none;
          border-color: var(--burgundy);
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
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
        <p className="text-body" style={{ color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={13} style={{ color: 'var(--ink-4)' }} />
          {filtered.length} of {RESTAURANTS.length} restaurants
          {hasFilters ? ' matching your filters' : ' · the world\'s 50 hardest tables'}
        </p>
      </div>

      {/* Search + Filters */}
      <div
        className="explore-filters"
        style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
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
            type="search"
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, city, or cuisine…"
            style={{ paddingLeft: 36, minHeight: 44, width: '100%' }}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
          >
            <option value="all">All cities</option>
            {ALL_CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
          >
            <option value="all">All platforms</option>
            {BOOKING_PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="all">All availability</option>
            <option value="available">Slots open</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Tracking</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => {
                setQuery('')
                setSelectedCity('all')
                setSelectedPlatform('all')
                setSelectedStatus('all')
              }}
              className="btn btn-ghost btn-sm"
              style={{ minHeight: 38 }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px' }}>
          <p className="text-body" style={{ color: 'var(--ink-3)' }}>
            No restaurants match your filters.
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
          {filtered.map((r: Restaurant) => (
            <Link
              key={r.id}
              href={`/restaurant/${r.id}`}
              className="restaurant-card-link"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                className="card restaurant-card"
                style={{
                  padding: 20,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                {/* Top row: stars + platform */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                  {r.michelinStars > 0 ? (
                    <Stars count={r.michelinStars} />
                  ) : (
                    <span className="text-caption" style={{ fontSize: 11, color: 'var(--ink-4)' }}>No Michelin</span>
                  )}
                  <BookingBadge platform={r.bookingPlatform} />
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

                {/* City · country · cuisine */}
                <p className="text-caption" style={{ marginBottom: 6 }}>
                  {r.city}, {r.country} · {r.cuisine}
                </p>

                {/* Wait time */}
                <p className="text-caption" style={{ color: 'var(--ink-4)', marginBottom: 14 }}>
                  Typical wait: {r.typicalWait}
                </p>

                {/* Availability status */}
                <AvailabilityPill status={r.availabilityStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
