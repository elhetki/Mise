// Load .env.local happens in index.ts before this module is imported.
// We use a lazy getter pattern so the env vars are available at call time.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, any, any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): SupabaseClient<any, any, any> {
  if (_client) return _client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check .env.local')
  }

  _client = createClient(supabaseUrl, supabaseServiceKey)
  return _client
}

// Export a lazy proxy that only initializes when first accessed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient<any, any, any>, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_target: any, prop: string | symbol) {
    const client = getClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
