'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AddWatchForm({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeFrom, setTimeFrom] = useState('12:00')
  const [timeTo, setTimeTo] = useState('21:00')
  const [partySize, setPartySize] = useState(2)
  const [flexibility, setFlexibility] = useState<'exact' | 'plus_minus_1' | 'plus_minus_3' | 'any_in_range'>('exact')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authError, setAuthError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    // Try to get user, but works without auth too (demo mode)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('watches').insert({
      user_id: user?.id || null,
      restaurant_id: restaurantId,
      date_from: dateFrom,
      date_to: dateTo,
      time_from: timeFrom + ':00',
      time_to: timeTo + ':00',
      party_size: partySize,
      flexibility,
      auto_book: false,
      status: 'active',
    })
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/watchlist?added=1')
      router.refresh()
    }
  }

  // Auth error state removed — works without login in demo mode

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        .watch-date-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 480px) {
          .watch-date-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="watch-date-grid">
        <div>
          <label className="label" htmlFor="dateFrom">From</label>
          <input
            id="dateFrom"
            type="date"
            className="input"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            required
            style={{ minHeight: 44 }}
          />
        </div>
        <div>
          <label className="label" htmlFor="dateTo">To</label>
          <input
            id="dateTo"
            type="date"
            className="input"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            required
            style={{ minHeight: 44 }}
          />
        </div>
      </div>

      <div className="watch-date-grid">
        <div>
          <label className="label" htmlFor="timeFrom">Earliest</label>
          <input
            id="timeFrom"
            type="time"
            className="input"
            value={timeFrom}
            onChange={e => setTimeFrom(e.target.value)}
            required
            style={{ minHeight: 44 }}
          />
        </div>
        <div>
          <label className="label" htmlFor="timeTo">Latest</label>
          <input
            id="timeTo"
            type="time"
            className="input"
            value={timeTo}
            onChange={e => setTimeTo(e.target.value)}
            required
            style={{ minHeight: 44 }}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="partySize">Party size</label>
        <select
          id="partySize"
          className="input"
          value={partySize}
          onChange={e => setPartySize(Number(e.target.value))}
          style={{ minHeight: 44 }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="flexibility">Flexibility</label>
        <select
          id="flexibility"
          className="input"
          value={flexibility}
          onChange={e => setFlexibility(e.target.value as typeof flexibility)}
          style={{ minHeight: 44 }}
        >
          <option value="exact">Exact dates only</option>
          <option value="plus_minus_1">± 1 day</option>
          <option value="plus_minus_3">± 3 days</option>
          <option value="any_in_range">Any date in range</option>
        </select>
      </div>

      {error && (
        <div style={{
          background: 'var(--red-bg)',
          border: '1px solid var(--red)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--red)',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center', marginTop: 4, minHeight: 44 }}
      >
        {loading ? 'Adding watch…' : 'Start watching'}
      </button>
    </form>
  )
}
