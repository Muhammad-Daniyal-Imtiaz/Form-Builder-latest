import { NextResponse } from 'next/server'

import { getRedisClient } from '@/lib/upstash'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { published } = await request.json()

    const { data: form, error } = await supabase
      .from('forms')
      .update({ published, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 })
      }
      throw error
    }

    const redis = getRedisClient()
    if (redis) {
      await redis.del(`form:${id}:meta`).catch((cacheError) => {
        console.error('[Cache] Redis del error:', cacheError)
      })
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
