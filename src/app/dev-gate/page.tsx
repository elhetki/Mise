'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function DevGateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/dev-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/watchlist'
        router.push(redirect)
      } else {
        setShake(true)
        setError('Wrong password')
        setPassword('')
        setTimeout(() => {
          setShake(false)
          inputRef.current?.focus()
        }, 500)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <span style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.03em',
        }}>
          mise
        </span>
      </div>

      <div
        className={`card${shake ? ' shake' : ''}`}
        style={{
          width: '100%',
          maxWidth: 360,
          padding: '32px 28px',
        }}
      >
        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.025em',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Developer Access
        </h1>
        <p className="text-caption" style={{ color: 'var(--ink-3)', textAlign: 'center', marginBottom: 28 }}>
          This app is in private development
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label" htmlFor="dev-password">Password</label>
            <input
              ref={inputRef}
              id="dev-password"
              type="password"
              className="input"
              placeholder="Enter developer password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="off"
              style={{ minHeight: 44 }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password}
            style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function DevGatePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: 'var(--ink-4)', fontSize: 14 }}>Loading…</span>
      </div>
    }>
      <DevGateForm />
    </Suspense>
  )
}
