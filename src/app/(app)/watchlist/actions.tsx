'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Watch } from '@/types'
import { Pause, Play, Trash2 } from 'lucide-react'

interface WatchlistActionsProps {
  watchId: string
  currentStatus: Watch['status']
}

export default function WatchlistActions({ watchId, currentStatus }: WatchlistActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'pause' | 'delete' | null>(null)

  async function handlePause() {
    setLoading('pause')
    const supabase = createClient()
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    await supabase.from('watches').update({ status: newStatus }).eq('id', watchId)
    router.refresh()
    setLoading(null)
  }

  async function handleDelete() {
    if (!confirm('Remove this watch?')) return
    setLoading('delete')
    const supabase = createClient()
    await supabase.from('watches').delete().eq('id', watchId)
    router.refresh()
    setLoading(null)
  }

  return (
    <>
      <button
        onClick={handlePause}
        disabled={loading !== null}
        className="btn btn-secondary btn-sm"
        style={{ minHeight: 36, gap: 6 }}
      >
        {currentStatus === 'active' ? (
          <><Pause size={13} /> Pause</>
        ) : (
          <><Play size={13} /> Resume</>
        )}
        {loading === 'pause' && '…'}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="btn btn-ghost btn-sm"
        style={{ minHeight: 36, gap: 6, color: 'var(--red)' }}
      >
        <Trash2 size={13} />
        {loading === 'delete' ? 'Removing…' : 'Remove'}
      </button>
    </>
  )
}
