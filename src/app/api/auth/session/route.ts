import { NextResponse } from 'next/server'

import { ensureUserProfile } from '@/lib/user-profile'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const dbUser = await ensureUserProfile(createAdminClient(), user, {
      markVerified: Boolean(user.email_confirmed_at),
    })

    return NextResponse.json({ user: dbUser })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
