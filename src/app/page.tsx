'use client'

import { useState } from 'react'
import { Star, Bell, Clock, Eye, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const FEATURED_RESTAURANTS = [
  { name: 'The Table', city: 'Hamburg', stars: 3, status: 'unavailable' as const },
  { name: 'Überfahrt', city: 'Rottach-Egern', stars: 3, status: 'unavailable' as const },
  { name: 'Schwarzwaldstube', city: 'Baiersbronn', stars: 3, status: 'limited' as const },
  { name: 'Vendôme', city: 'Bergisch Gladbach', stars: 3, status: 'unavailable' as const },
  { name: 'Restaurant Amador', city: 'Wien', stars: 3, status: 'available' as const },
]

const VALUE_PROPS = [
  {
    icon: Eye,
    title: 'Continuous Monitoring',
    desc: 'We check availability every few minutes so you don\'t have to.',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    desc: 'Get notified the moment a table opens at your target date and party size.',
  },
  {
    icon: Clock,
    title: 'Flexible Windows',
    desc: 'Set a date range and time window. We\'ll find any opening that works for you.',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} Michelin stars`}>
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

function StatusPill({ status }: { status: 'available' | 'limited' | 'unavailable' }) {
  const config = {
    available:   { dot: 'status-dot-available',   label: 'Slots open' },
    limited:     { dot: 'status-dot-limited',      label: 'Limited' },
    unavailable: { dot: 'status-dot-unavailable',  label: 'Tracking' },
  }[status]

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`status-dot ${config.dot}`} />
      <span className="text-caption">{config.label}</span>
    </span>
  )
}

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 32px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
          }}>
            mise
          </span>
          <Link
            href="/login"
            className="btn btn-ghost btn-sm"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '80px 32px 64px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 64,
          alignItems: 'start',
        }}>
          {/* Left: Text + Form */}
          <div style={{ maxWidth: 560 }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--burgundy-bg)',
              color: 'var(--burgundy)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: 999,
              marginBottom: 24,
            }}>
              Michelin Restaurant Tracker
            </div>

            <h1 style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 'clamp(32px, 4vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              marginBottom: 20,
            }}>
              Never miss a table at your favourite restaurant
            </h1>

            <p style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--ink-2)',
              marginBottom: 40,
              maxWidth: 440,
            }}>
              Mise watches Michelin-starred restaurants around the clock and alerts you the moment a reservation becomes available — for your date, time, and party size.
            </p>

            {submitted ? (
              <div style={{
                background: 'var(--green-bg)',
                border: '1px solid var(--green)',
                borderRadius: 12,
                padding: '20px 24px',
                color: 'var(--green)',
                fontSize: 15,
                fontWeight: 500,
              }}>
                ✓ You&apos;re on the list. We&apos;ll be in touch soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 440 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flexShrink: 0 }}
                >
                  {loading ? 'Joining…' : 'Join waitlist'}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>
            )}

            {error && (
              <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{error}</p>
            )}

            <p style={{ color: 'var(--ink-4)', fontSize: 12, marginTop: 12 }}>
              No spam. Early access only.
            </p>
          </div>

          {/* Right: Restaurant preview card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink)',
              }}>
                Watching now
              </span>
              <span className="text-caption">5 restaurants</span>
            </div>

            <div style={{ padding: '8px 0' }}>
              {FEATURED_RESTAURANTS.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: i < FEATURED_RESTAURANTS.length - 1 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 2,
                    }}>
                      {r.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Stars count={r.stars} />
                      <span className="text-caption">{r.city}</span>
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>

            <div style={{
              padding: '14px 20px',
              background: 'var(--paper-dark)',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <div className="status-dot status-dot-available" />
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
                Restaurant Amador just opened a table for 2
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 32px' }}>
        <div className="divider" />
      </div>

      {/* Value props */}
      <section style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '64px 32px',
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          marginBottom: 40,
        }}>
          How it works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}>
          {VALUE_PROPS.map((vp, i) => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--burgundy-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <vp.icon size={18} style={{ color: 'var(--burgundy)' }} />
              </div>
              <h3 style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: 8,
                letterSpacing: '-0.01em',
              }}>
                {vp.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {vp.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--line)',
        padding: '32px',
        textAlign: 'left',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink-3)',
            letterSpacing: '-0.02em',
          }}>
            mise
          </span>
          <span className="text-caption">
            © {new Date().getFullYear()} Mise. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  )
}
