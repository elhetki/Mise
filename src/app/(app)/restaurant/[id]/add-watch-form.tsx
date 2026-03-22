'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to add a watch.')
      setLoading(false)
      return
    }
    const { error: insertError } = await supabase.from('watches').insert({
      user_id: user.id,
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
      setSuccess(true)
      router.push('/watchlist')
      router.refresh()
    }
  }

  if (success) {
    return (
      <div style={{
        color: 'var(--green)',
        fontSize: 14,
        fontWeight: 500,
        padding: '12px 0',
      }}>
        ✓ Watch added! Redirecting to watchlist…
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="label" htmlFor="dateFrom">From</label>
          <input
            id="dateFrom"
            type="date"
            className="input"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            required
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
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="label" htmlFor="timeFrom">Earliest</label>
          <input
            id="timeFrom"
            type="time"
            className="input"
            value={timeFrom}
            onChange={e => setTimeFrom(e.target.value)}
            required
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
        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
      >
        {loading ? 'Adding watch…' : 'Start watching'}
      </button>
    </form>
  )
}
