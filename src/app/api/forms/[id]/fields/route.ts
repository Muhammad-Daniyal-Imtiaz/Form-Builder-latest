import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forms, formFields } from '@/db/schema'
import { getAuthUserId, AuthError } from '@/lib/auth'
import { eq, and, asc } from 'drizzle-orm'
import { FieldsPayloadSchema, normalizeFieldForPersistence } from '@/lib/form-import-schema'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()

    const [form] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)))
    if (!form) return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 })

    const body = await request.json()
    const parsedFields = FieldsPayloadSchema.safeParse(body.fields)

    if (!parsedFields.success) {
      return NextResponse.json({ error: 'Invalid field payload', details: parsedFields.error.issues }, { status: 400 })
    }

    const normalizedFields = parsedFields.data.map((field, index) => {
      const normalized = normalizeFieldForPersistence(field, index)
      return {
        id: field.id ?? crypto.randomUUID(),
        formId: id,
        label: normalized.label,
        type: normalized.type,
        required: normalized.required,
        options: normalized.options,
        placeholder: normalized.placeholder,
        order: normalized.order,
        logicRules: normalized.logicRules,
        pageIndex: normalized.pageIndex,
      }
    })

    // Delete old fields then insert new ones
    await db.delete(formFields).where(eq(formFields.formId, id))

    if (normalizedFields.length > 0) {
      await db.insert(formFields).values(normalizedFields)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('PUT fields error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
