import { sanitizeRedirectPath } from '@/lib/auth-redirect'
import { ensureUserProfile } from '@/lib/user-profile'
import { createAdminClient, createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const redirectTo = sanitizeRedirectPath(
      typeof body.redirectTo === 'string' ? body.redirectTo : undefined
    )

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json({ error: 'Please verify your email before signing in' }, { status: 401 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
    }

    const user = await ensureUserProfile(adminClient, authData.user, {
      markVerified: true,
      touchLastLogin: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully!',
      user,
      redirectTo,
    })
  } catch (error: unknown) {
    console.error('Signin error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Signin failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
