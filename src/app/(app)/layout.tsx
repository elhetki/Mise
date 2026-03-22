import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSidebar from './sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--paper)',
    }}>
      <AppSidebar />
      <main style={{
        flex: 1,
        overflow: 'auto',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
