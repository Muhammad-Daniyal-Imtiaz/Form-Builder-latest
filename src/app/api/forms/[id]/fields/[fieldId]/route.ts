import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forms, formFields } from '@/db/schema'
import { getAuthUserId, AuthError } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'
import { FieldSchema, normalizeFieldForPersistence } from '@/lib/form-import-schema'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()

    const [form] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)))
    if (!form) return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 })

    const fieldBody = await request.json()
    const parsedField = FieldSchema.safeParse(fieldBody)

    if (!parsedField.success) {
      return NextResponse.json(
        { error: 'Invalid field payload', details: parsedField.error.issues },
        { status: 400 }
      )
    }

    const [maxOrderField] = await db.select({ order: formFields.order }).from(formFields).where(eq(formFields.formId, id)).orderBy(desc(formFields.order)).limit(1)

    const normalizedField = normalizeFieldForPersistence(
      parsedField.data,
      maxOrderField ? maxOrderField.order + 1 : 0
    )

    const insertValues = {
      id: parsedField.data.id ?? crypto.randomUUID(),
      formId: id,
      label: normalizedField.label,
      type: normalizedField.type,
      required: normalizedField.required,
      options: normalizedField.options,
      placeholder: normalizedField.placeholder,
      order: normalizedField.order,
      logicRules: normalizedField.logicRules,
      pageIndex: normalizedField.pageIndex,
    }

    await db.insert(formFields).values(insertValues)

    const [field] = await db.select().from(formFields).where(eq(formFields.id, insertValues.id))

    return NextResponse.json(field, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('POST field error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
