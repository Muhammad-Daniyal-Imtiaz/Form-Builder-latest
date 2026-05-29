import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forms, formFields } from '@/db/schema'
import { getAuthUserId, AuthError } from '@/lib/auth'
import { getRedisClient } from '@/lib/upstash'
import { eq, and } from 'drizzle-orm'
import { FieldsPayloadSchema, normalizeFieldForPersistence } from '@/lib/form-import-schema'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()

    const { published } = await request.json()

    const [existing] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)))
    if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    await db.update(forms).set({ published, updatedAt: new Date().toISOString() }).where(eq(forms.id, id))

    const redis = getRedisClient()
    if (redis) await redis.del(`form:${id}:meta`).catch(() => {})

    const [updated] = await db.select().from(forms).where(eq(forms.id, id))
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
