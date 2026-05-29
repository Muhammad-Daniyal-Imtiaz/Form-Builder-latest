import { db } from '@/db'
import { forms, submissions } from '@/db/schema'
import { getAuthUserId, requireUser, AuthError } from '@/lib/auth'
import { eq, and, desc, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const userId = await getAuthUserId()

    const allForms = await db
      .select({
        id: forms.id,
        userId: forms.userId,
        title: forms.title,
        description: forms.description,
        published: forms.published,
        logoUrl: forms.logoUrl,
        coverImageUrl: forms.coverImageUrl,
        createdAt: forms.createdAt,
        updatedAt: forms.updatedAt,
      })
      .from(forms)
      .where(eq(forms.userId, userId))
      .orderBy(desc(forms.createdAt))

    // Attach submission counts
    const formsWithCounts = await Promise.all(
      allForms.map(async (form) => {
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(submissions)
          .where(eq(submissions.formId, form.id))
        return { ...form, submissions: [{ count: result?.count ?? 0 }] }
      })
    )

    return NextResponse.json(formsWithCounts)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('GET forms error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { title, description } = await request.json()

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await db.insert(forms).values({
      id,
      userId: user.id,
      title,
      description,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    const [form] = await db.select().from(forms).where(eq(forms.id, id))
    return NextResponse.json(form, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('POST form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
