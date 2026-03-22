'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppSidebar from './sidebar'
import { Menu } from 'lucide-react'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
    })
  }, [router])

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
            <div style={{ width: 36 }} />
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
