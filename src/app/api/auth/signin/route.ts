import { sanitizeRedirectPath } from '@/lib/auth-redirect'
import { ensureUserProfile } from '@/lib/user-profile'
import { createAdminClient, createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { verifyTurnstile } from '@/lib/turnstile'
import { getAuthRateLimit } from '@/lib/upstash'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const captchaToken = typeof body.captchaToken === 'string' ? body.captchaToken : ''
    const redirectTo = sanitizeRedirectPath(
      typeof body.redirectTo === 'string' ? body.redirectTo : undefined
    )

    const clientIp = request.headers.get('x-vercel-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     'anonymous'
    
    const ratelimit = getAuthRateLimit()
    if (ratelimit) {
      const { success } = await ratelimit.limit(`auth:${clientIp}`)
      if (!success) {
        return NextResponse.json({ 
          error: 'Too many authentication attempts. Please try again later.' 
        }, { status: 429 })
      }
    }

    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!captchaToken) {
        return NextResponse.json({ error: 'Security check required' }, { status: 400 })
      }
      const isValid = await verifyTurnstile(captchaToken)
      if (!isValid) {
        return NextResponse.json({ error: 'Security verification failed' }, { status: 400 })
      }
    }

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
