'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppSidebar from './sidebar'
import { Menu, Bell } from 'lucide-react'
import Link from 'next/link'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
      } else {
        setChecking(false)
        // Fetch unread notification count
        fetchUnreadCount(user.id)
      }
    })
  }, [router])

  async function fetchUnreadCount(userId: string) {
    const supabase = createClient()
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
    setUnreadCount(count ?? 0)
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: 'var(--ink-4)', fontSize: 14 }}>Loading…</span>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .desktop-sidebar { display: flex; }
        .mobile-topbar { display: none; }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .app-content { padding-left: 0 !important; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--paper)',
      }}>
        <AppSidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          unreadCount={unreadCount}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Mobile top bar */}
          <div
            className="mobile-topbar"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              height: 52,
              background: 'var(--paper-light)',
              borderBottom: '1px solid var(--line)',
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="btn btn-ghost btn-sm"
              style={{ padding: 8 }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.03em',
            }}>
              mise
            </span>
            {/* Mobile bell icon */}
            <Link
              href="/notifications"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: 6, color: 'var(--ink-2)', textDecoration: 'none' }}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: 'var(--burgundy)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '0 4px',
                  minWidth: 16,
                  height: 16,
                  textAlign: 'center',
                  lineHeight: '16px',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

          <main className="app-content" style={{
            flex: 1,
            overflow: 'auto',
            minHeight: '100vh',
          }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
