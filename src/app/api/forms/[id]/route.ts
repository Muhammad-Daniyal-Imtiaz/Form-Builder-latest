import { getRedisClient } from '@/lib/upstash'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: form, error } = await supabase
      .from('forms')
      .select(`
        *,
        form_fields (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 })
      }
      throw error
    }

    // Sort fields by order
    if (form.form_fields) {
      form.form_fields.sort((a: any, b: any) => a.order - b.order)
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error('GET form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.published !== undefined) updateData.published = updates.published
    if (updates.logo_url !== undefined) updateData.logo_url = updates.logo_url
    if (updates.cover_image_url !== undefined) updateData.cover_image_url = updates.cover_image_url

    const { data: form, error } = await supabase
      .from('forms')
      .update(updateData)
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
    console.error('PUT form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    const redis = getRedisClient()
    if (redis) {
      await redis.del(`form:${id}:meta`).catch((cacheError) => {
        console.error('[Cache] Redis del error:', cacheError)
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
