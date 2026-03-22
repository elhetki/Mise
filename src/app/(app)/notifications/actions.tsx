'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCheck, Trash2, Check } from 'lucide-react'

interface Props {
  action: 'mark-read' | 'mark-all-read' | 'delete'
  notificationId?: string
  userId?: string
}

export default function NotificationActions({ action, notificationId, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function handleMarkRead() {
    if (!notificationId) return
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
    router.refresh()
  }

  async function handleMarkAllRead() {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    router.refresh()
  }

  async function handleDelete() {
    if (!notificationId) return
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    router.refresh()
  }

  if (action === 'mark-all-read') {
    return (
      <button
        onClick={handleMarkAllRead}
        className="btn btn-secondary btn-sm"
        style={{ gap: 6, minHeight: 44 }}
      >
        <CheckCheck size={14} />
        Mark all read
      </button>
    )
  }

  if (action === 'mark-read') {
    return (
      <button
        onClick={handleMarkRead}
        className="btn btn-ghost btn-sm"
        style={{ padding: '6px', minHeight: 36, minWidth: 36, color: 'var(--ink-3)' }}
        aria-label="Mark as read"
        title="Mark as read"
      >
        <Check size={14} />
      </button>
    )
  }

  if (action === 'delete') {
    return (
      <button
        onClick={handleDelete}
        className="btn btn-ghost btn-sm"
        style={{ padding: '6px', minHeight: 36, minWidth: 36, color: 'var(--ink-4)' }}
        aria-label="Delete notification"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    )
  }

  return null
}
