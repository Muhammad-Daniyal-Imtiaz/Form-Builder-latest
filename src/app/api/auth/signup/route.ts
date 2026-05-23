import { NextResponse } from 'next/server'
import { verifyTurnstile } from '@/lib/turnstile'
import { getAuthRateLimit } from '@/lib/upstash'
import { ensureUserProfile } from '@/lib/user-profile'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const captchaToken = typeof body.captchaToken === 'string' ? body.captchaToken : ''

    const clientIp = request.headers.get('x-vercel-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     'anonymous'
    
    const ratelimit = getAuthRateLimit()
    if (ratelimit) {
      const { success } = await ratelimit.limit(`auth:${clientIp}`)
      if (!success) {
        return NextResponse.json({ 
          error: 'Too many signup attempts. Please try again later.' 
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

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()
    const baseUrl = new URL(request.url).origin

    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${baseUrl}/api/auth/confirm?next=${encodeURIComponent('/dashboard')}`,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'User creation failed' },
        { status: 400 }
      )
    }

    try {
      await ensureUserProfile(adminClient, authData.user, {
        markVerified: Boolean(authData.user.email_confirmed_at),
        touchLastLogin: Boolean(authData.session),
      })
    } catch (profileError) {
      console.error('User profile creation error:', profileError)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: authData.session
        ? 'Signup successful! Redirecting...'
        : 'Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email,
        name,
        role: 'user',
        is_verified: authData.user.email_confirmed_at !== null,
      },
    })
  } catch (error: unknown) {
    console.error('Signup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Signup failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
