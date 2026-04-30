import { sanitizeRedirectPath } from '@/lib/auth-redirect'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const redirectTo = sanitizeRedirectPath(searchParams.get('redirectTo'))
    const requestedScope = searchParams.get('scope')
    
    // Robust Base URL detection for Cloudflare/Production
    const requestUrl = new URL(request.url)
    const protocol = requestUrl.hostname === 'localhost' ? 'http' : 'https'
    const baseUrl = `${protocol}://${requestUrl.host}`

    // Default scopes for login
    let scopes = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
    
    // Add spreadsheets scope ONLY if explicitly requested
    if (requestedScope === 'sheets') {
      scopes += ' https://www.googleapis.com/auth/spreadsheets'
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        scopes: scopes,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error || !data?.url) {
      console.error('Google OAuth error:', error)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'auth_failed')
      return NextResponse.redirect(errorUrl)
    }

    return NextResponse.redirect(data.url)
  } catch (error) {
    console.error('Google OAuth route error:', error)
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'server_error')
    return NextResponse.redirect(errorUrl)
  }
}
