import { createClient } from '@/lib/supabase/server'
import { Booking, Restaurant } from '@/types'
import { CalendarCheck } from 'lucide-react'

type BookingWithRestaurant = Booking & { restaurant: Restaurant }

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const config: Record<Booking['status'], { bg: string; color: string; label: string }> = {
    confirmed: { bg: 'var(--green-bg)', color: 'var(--green)', label: 'Confirmed' },
    cancelled: { bg: 'var(--red-bg)', color: 'var(--red)', label: 'Cancelled' },
    completed: { bg: 'var(--paper-dark)', color: 'var(--ink-3)', label: 'Completed' },
    no_show:   { bg: 'var(--amber-bg)', color: 'var(--amber)', label: 'No-show' },
  }
  const c = config[status]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 999,
      background: c.bg,
      color: c.color,
      fontSize: 12,
      fontWeight: 500,
    }}>
      {c.label}
    </span>
  )
}

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, restaurant:restaurants(*)')
    .order('date', { ascending: false })
    .order('time', { ascending: true })

  const typedBookings = (bookings ?? []) as BookingWithRestaurant[]

  return (
    <div style={{ padding: '28px 16px', maxWidth: 900 }}>
      <style>{`
        @media (min-width: 768px) {
          .bookings-container { padding: 40px 48px !important; }
        }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 26,
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

      {typedBookings.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {typedBookings.map((booking) => (
            <div key={booking.id} className="card" style={{ padding: '18px 20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: 6,
                  }}>
                    {booking.restaurant?.name ?? 'Unknown restaurant'}
                  </h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span className="text-caption">{formatDate(booking.date)}</span>
                    <span className="text-caption">{formatTime(booking.time)}</span>
                    <span className="text-caption">{booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}</span>
                    {booking.confirmation_ref && (
                      <span className="text-caption">Ref: {booking.confirmation_ref}</span>
                    )}
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
