import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Use service role key if available, fall back to anon key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim() })

    if (error) {
      // Duplicate email — treat as success (don't leak info)
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already on the list.' }, { status: 200 })
      }
      console.error('Waitlist insert error:', error)
      return NextResponse.json({ error: 'Failed to join waitlist. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Successfully joined the waitlist.' }, { status: 201 })
  } catch (err) {
    console.error('Waitlist route error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
