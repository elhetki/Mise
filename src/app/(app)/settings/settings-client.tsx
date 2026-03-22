'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Trash2 } from 'lucide-react'

export default function SettingsClient() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [showDeleteInfo, setShowDeleteInfo] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Sign out */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>Sign out</div>
            <p className="text-caption">You&apos;ll be returned to the home page</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6, minHeight: 44 }}
          >
            <LogOut size={14} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>

      {/* Delete account */}
      <div className="card" style={{ padding: '20px 24px', borderColor: 'var(--line)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--red)', marginBottom: 2 }}>Delete account</div>
            <p className="text-caption">Permanently remove your data</p>
          </div>
          <button
            onClick={() => setShowDeleteInfo(true)}
            className="btn btn-ghost btn-sm"
            style={{ gap: 6, color: 'var(--red)', minHeight: 44 }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>

        {showDeleteInfo && (
          <div style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
            fontSize: 13,
            color: 'var(--ink-3)',
          }}>
            To delete your account, please contact{' '}
            <a href="mailto:support@mise.app" style={{ color: 'var(--burgundy)', fontWeight: 500 }}>
              support@mise.app
            </a>
            . We&apos;ll process your request within 48 hours.
          </div>
        )}
      </div>
    </div>
  )
}
