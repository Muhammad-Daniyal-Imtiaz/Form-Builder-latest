import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { sanitizeRedirectPath } from '@/lib/auth-redirect'
import { ensureUserProfile } from '@/lib/user-profile'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get('next'))

  if (!tokenHash || !type) {
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'invalid_confirmation_link')
    return NextResponse.redirect(errorUrl)
  }

  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    if (error || !data.user) {
      console.error('Email confirmation error:', error)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'email_confirmation_failed')
      return NextResponse.redirect(errorUrl)
    }

    await ensureUserProfile(adminClient, data.user, {
      markVerified: true,
    })

    return NextResponse.redirect(new URL(nextPath, request.url))
  } catch (error) {
    console.error('Confirm route error:', error)
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'server_error')
    return NextResponse.redirect(errorUrl)
  }
}
