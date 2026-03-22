import { CalendarCheck } from 'lucide-react'

export default function BookingsPage() {
  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.025em',
          marginBottom: 4,
        }}>
          Bookings
        </h1>
        <p className="text-body" style={{ color: 'var(--ink-3)' }}>
          Your confirmed reservations
        </p>
      </div>

      <div className="card" style={{ padding: '64px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <CalendarCheck size={22} style={{ color: 'var(--burgundy)' }} />
        </div>
        <h2 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--ink)',
        }}>
          No bookings yet
        </h2>
        <p className="text-body" style={{ color: 'var(--ink-3)', maxWidth: 320 }}>
          When Mise auto-books a table for you or you confirm a reservation, it will appear here.
        </p>
      </div>
    </div>
  )
}
