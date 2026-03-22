import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ padding: '28px 16px', maxWidth: 600 }}>
      <style>{`
        @media (min-width: 768px) {
          .settings-container { padding: 40px 48px !important; }
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
          Settings
        </h1>
        <p className="text-body" style={{ color: 'var(--ink-3)' }}>
          Account and preferences
        </p>
      </div>

      {/* Account section */}
      <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
        <h2 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: 20,
          letterSpacing: '-0.01em',
        }}>
          Account
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Email</label>
            <div style={{
              padding: '10px 14px',
              background: 'var(--paper-dark)',
              borderRadius: 8,
              border: '1px solid var(--line)',
              fontSize: 14,
              color: 'var(--ink)',
            }}>
              {user.email}
            </div>
          </div>

          <div>
            <label className="label">Plan</label>
            <div style={{
              padding: '10px 14px',
              background: 'var(--paper-dark)',
              borderRadius: 8,
              border: '1px solid var(--line)',
              fontSize: 14,
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: 999,
                background: 'var(--burgundy-bg)',
                color: 'var(--burgundy)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                {(profile as { tier?: string } | null)?.tier ?? 'Free'}
              </span>
              <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>Early access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <SettingsClient />
    </div>
  )
}
