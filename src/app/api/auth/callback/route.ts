import { NextResponse } from 'next/server'

import { sanitizeRedirectPath } from '@/lib/auth-redirect'
import { ensureUserProfile } from '@/lib/user-profile'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const redirectTo = sanitizeRedirectPath(requestUrl.searchParams.get('redirectTo'))

    if (!code) {
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'no_code')
      return NextResponse.redirect(errorUrl)
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.exchangeCodeForSession(code)

    if (authError || !session?.user) {
      console.error('Auth callback error:', authError)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'auth_failed')
      return NextResponse.redirect(errorUrl)
    }

    const user = session.user

    if (session.provider_token || session.provider_refresh_token) {
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

      await adminClient.from('user_integrations').upsert({
        user_id: user.id,
        provider: 'google',
        access_token: session.provider_token,
        refresh_token: session.provider_refresh_token,
        email: user.email,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
    }

    await ensureUserProfile(adminClient, user, {
      markVerified: true,
      touchLastLogin: true,
    })

    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (error) {
    console.error('Callback error:', error)
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'server_error')
    return NextResponse.redirect(errorUrl)
  }
}
