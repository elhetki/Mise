import { createClient } from '@/lib/supabase/server'
import { Notification } from '@/types'
import { Bell, Trash2, CheckCheck } from 'lucide-react'
import NotificationActions from './actions'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(50)

  const items = (notifications ?? []) as Notification[]
  const unreadCount = items.filter(n => !n.read_at).length

  return (
    <div style={{ padding: '28px 16px', maxWidth: 700 }}>
      <style>{`
        @media (min-width: 768px) {
          .notif-container { padding: 40px 48px !important; }
        }
        .notif-card:hover {
          background: var(--paper-light) !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.025em',
            marginBottom: 4,
          }}>
            Notifications
          </h1>
          <p className="text-body" style={{ color: 'var(--ink-3)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        {unreadCount > 0 && (
          <NotificationActions action="mark-all-read" userId={user.id} />
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="card" style={{
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
        }}>
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
            <Bell size={22} style={{ color: 'var(--burgundy)' }} />
          </div>
          <h2 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--ink)',
          }}>
            No notifications yet
          </h2>
          <p className="text-body" style={{ color: 'var(--ink-3)', maxWidth: 320 }}>
            When a table opens up at a restaurant you&apos;re watching, you&apos;ll see it here.
          </p>
        </div>
      )}

      {/* Notification list */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((notif) => (
            <div
              key={notif.id}
              className="card notif-card"
              style={{
                padding: '16px 20px',
                background: notif.read_at ? 'var(--paper)' : 'var(--burgundy-bg)',
                borderLeft: notif.read_at ? '2px solid transparent' : '2px solid var(--burgundy)',
                transition: 'background 0.15s ease',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {!notif.read_at && (
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'var(--burgundy)',
                        flexShrink: 0,
                      }} />
                    )}
                    <h3 style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      lineHeight: 1.3,
                    }}>
                      {notif.title}
                    </h3>
                  </div>
                  <p className="text-body" style={{ color: 'var(--ink-2)', marginBottom: 8 }}>
                    {notif.body}
                  </p>
                  <span className="text-caption" style={{ color: 'var(--ink-4)' }}>
                    {timeAgo(notif.sent_at)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {!notif.read_at && (
                    <NotificationActions action="mark-read" notificationId={notif.id} />
                  )}
                  <NotificationActions action="delete" notificationId={notif.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
