'use client'

import { useState } from 'react'
import { Star, Bell, Clock, ArrowRight, Check } from 'lucide-react'

const FEATURED_RESTAURANTS = [
  { name: 'The Table', city: 'Hamburg', stars: 3, status: 'unavailable' as const },
  { name: 'Überfahrt', city: 'Rottach-Egern', stars: 3, status: 'unavailable' as const },
  { name: 'Schwarzwaldstube', city: 'Baiersbronn', stars: 3, status: 'limited' as const },
  { name: 'Vendôme', city: 'Bergisch Gladbach', stars: 3, status: 'unavailable' as const },
  { name: 'Restaurant Amador', city: 'Wien', stars: 3, status: 'available' as const },
]

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill="var(--accent)" stroke="none" />
      ))}
    </span>
  )
}

function StatusDot({ status }: { status: 'available' | 'limited' | 'unavailable' }) {
  const colors = {
    available: 'var(--success)',
    limited: 'var(--warning)',
    unavailable: 'var(--error)',
  }
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: colors[status] }}
    />
  )
}

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    // TODO: Save to Supabase waitlist table
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16">
        <span className="text-heading-16" style={{ color: 'var(--text-primary)' }}>mise</span>
        <a
          href="/login"
          className="text-body-14 cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          Sign in
        </a>
      </nav>

      {/* Hero — left-aligned, asymmetric */}
      <main className="px-6 md:px-12 pt-16 md:pt-24 pb-16 max-w-[1200px]">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-16 md:gap-24 items-start">
          {/* Left — copy */}
          <div>
            <p
              className="text-label mb-4"
              style={{ color: 'var(--accent)' }}
            >
              Michelin Restaurant Tracker
            </p>

            <h1
              className="text-display mb-6"
              style={{ color: 'var(--text-primary)', maxWidth: '520px' }}
            >
              Never miss a table at your favorite restaurant
            </h1>

            <p
              className="text-body-16 mb-12"
              style={{ color: 'var(--text-secondary)', maxWidth: '460px' }}
            >
              Mise tracks Michelin-starred restaurants for open slots and notifies you instantly. Stop refreshing booking pages — let us watch for you.
            </p>

            {/* Waitlist form */}
            {submitted ? (
              <div className="flex items-center gap-3 py-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--success-muted)' }}
                >
                  <Check size={16} style={{ color: 'var(--success)' }} />
                </div>
                <span className="text-body-14" style={{ color: 'var(--text-primary)' }}>
                  You&apos;re on the list. We&apos;ll notify you when Mise launches.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-3 max-w-[400px]">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary shrink-0">
                  Join waitlist
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            {/* Value props */}
            <div className="flex flex-col gap-4 mt-12">
              {[
                { icon: Bell, text: 'Instant alerts when a slot opens' },
                { icon: Clock, text: 'Checks every 5 minutes, 24/7' },
                { icon: Star, text: '15+ Michelin restaurants tracked' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-body-14" style={{ color: 'var(--text-secondary)' }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live restaurant preview */}
          <div
            className="rounded-2xl p-1 mt-4 md:mt-12"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="p-4">
              <p className="text-caption mb-4" style={{ color: 'var(--text-muted)' }}>
                Live tracking
              </p>
              <div className="flex flex-col gap-1">
                {FEATURED_RESTAURANTS.map(r => (
                  <div
                    key={r.name}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg"
                    style={{ transition: 'background-color 150ms var(--ease-out-quart)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <StatusDot status={r.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-body-14 truncate" style={{ color: 'var(--text-primary)' }}>
                          {r.name}
                        </span>
                        <Stars count={r.stars} />
                      </div>
                      <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                        {r.city}
                      </span>
                    </div>
                    <span
                      className="text-caption shrink-0"
                      style={{
                        color: r.status === 'available' ? 'var(--success)'
                          : r.status === 'limited' ? 'var(--warning)'
                          : 'var(--text-muted)'
                      }}
                    >
                      {r.status === 'available' ? 'Slots open'
                        : r.status === 'limited' ? 'Limited'
                        : 'Tracking'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
          © 2026 Mise. Built for Michelin enthusiasts.
        </span>
      </footer>
    </div>
  )
}
