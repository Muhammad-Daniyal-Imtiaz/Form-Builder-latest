import { ensureUserProfile } from '@/lib/user-profile'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: forms, error } = await supabase
      .from('forms')
      .select('*, submissions(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(forms)
  } catch (error) {
    console.error('GET forms error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description } = await request.json()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    await ensureUserProfile(adminClient, user, {
      markVerified: Boolean(user.email_confirmed_at),
    })

    const { data: form, error } = await supabase
      .from('forms')
      .insert({
        user_id: user.id,
        title,
        description,
        published: false
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(form, { status: 201 })
  } catch (error) {
    console.error('POST form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
