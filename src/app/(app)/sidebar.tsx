'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, Compass, CalendarCheck, Settings, X, Bell } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/explore',   label: 'Explore',   icon: Compass },
  { href: '/bookings',  label: 'Bookings',  icon: CalendarCheck },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { href: '/settings',  label: 'Settings',  icon: Settings },
]

interface AppSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
  unreadCount?: number
}

export default function AppSidebar({ mobileOpen = false, onClose, unreadCount = 0 }: AppSidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--paper-light)',
      borderRight: '1px solid var(--line)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      height: '100%',
    }}>
      {/* Logo + close button on mobile */}
      <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          href="/watchlist"
          onClick={onClose}
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
            textDecoration: 'none',
          }}
        >
          mise
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 6 }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="divider" style={{ margin: '0 20px 16px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, showBadge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const badgeCount = showBadge && href === '/notifications' ? unreadCount : 0
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--burgundy)' : 'var(--ink-2)',
                background: active ? 'var(--burgundy-bg)' : 'transparent',
                textDecoration: 'none',
                position: 'relative',
                transition: 'background 0.15s ease, color 0.15s ease',
                borderLeft: active ? '2px solid var(--burgundy)' : '2px solid transparent',
                minHeight: 44,
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.75} />
              <span style={{ flex: 1 }}>{label}</span>
              {badgeCount > 0 && (
                <span style={{
                  background: 'var(--burgundy)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 6px',
                  minWidth: 18,
                  textAlign: 'center',
                  lineHeight: '16px',
                }}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 24px 0' }}>
        <div className="divider" style={{ marginBottom: 16 }} />
        <span className="text-caption">mise · 50 global restaurants</span>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {sidebarContent}
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 998,
            }}
          />
          {/* Drawer */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 240,
            zIndex: 999,
          }}>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}
