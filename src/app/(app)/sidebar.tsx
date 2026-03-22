'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, Compass, CalendarCheck, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/explore',   label: 'Explore',   icon: Compass },
  { href: '/bookings',  label: 'Bookings',  icon: CalendarCheck },
  { href: '/settings',  label: 'Settings',  icon: Settings },
]

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--paper-light)',
      borderRight: '1px solid var(--line)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px' }}>
        <Link
          href="/watchlist"
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
      </div>

      {/* Divider */}
      <div className="divider" style={{ margin: '0 20px 16px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
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
                marginLeft: 0,
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: subtle version tag */}
      <div style={{ padding: '16px 24px 0' }}>
        <div className="divider" style={{ marginBottom: 16 }} />
        <span className="text-caption">mise · early access</span>
      </div>
    </aside>
  )
}
