import { db } from '@/db'
import { forms, formFields } from '@/db/schema'
import { getAuthUserId, AuthError } from '@/lib/auth'
import { getRedisClient } from '@/lib/upstash'
import { eq, and, asc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()

    const [form] = await db.select().from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)))
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    const fields = await db.select().from(formFields).where(eq(formFields.formId, id)).orderBy(asc(formFields.order))

    return NextResponse.json({ ...form, form_fields: fields })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('GET form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()

    const [existing] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)))
    if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    const updates = await request.json()
    const updateData: Record<string, any> = { updatedAt: new Date().toISOString() }

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.published !== undefined) updateData.published = updates.published
    if (updates.logo_url !== undefined) updateData.logoUrl = updates.logo_url
    if (updates.cover_image_url !== undefined) updateData.coverImageUrl = updates.cover_image_url

    await db.update(forms).set(updateData).where(eq(forms.id, id))

    const redis = getRedisClient()
    if (redis) await redis.del(`form:${id}:meta`).catch(() => {})

    const [updated] = await db.select().from(forms).where(eq(forms.id, id))
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('PUT form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()

    const [existing] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)))
    if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    await db.delete(forms).where(eq(forms.id, id))

    const redis = getRedisClient()
    if (redis) await redis.del(`form:${id}:meta`).catch(() => {})

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('DELETE form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
