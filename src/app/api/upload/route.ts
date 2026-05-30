import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forms, files } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { putR2Object } from '@/lib/r2-storage'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'application/json', 'text/plain', 'text/csv', 'application/msword',
  'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

function isAllowedFileType(file: File) {
  if (ALLOWED_FILE_TYPES.has(file.type)) return true
  return file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/')
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    const formData = await request.formData()
    const file = formData.get('file')
    const formId = formData.get('formId')

    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (typeof formId !== 'string' || !formId) return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })

    const [form] = await db
      .select({ id: forms.id, userId: forms.userId, published: forms.published })
      .from(forms)
      .where(eq(forms.id, formId))

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    const isOwner = Boolean(userId && userId === form.userId)
    if (!form.published && !isOwner) return NextResponse.json({ error: 'Files can only be uploaded to published forms' }, { status: 403 })
    if (file.size > MAX_FILE_SIZE_BYTES) return NextResponse.json({ error: 'File is too large. Maximum size is 50MB.' }, { status: 400 })
    if (!isAllowedFileType(file)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })

    const safeFileName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
    const filePath = `${form.id}/${safeFileName}`
    const mimeType = file.type || 'application/octet-stream'

    try {
      await putR2Object(filePath, await file.arrayBuffer(), mimeType)
      await db.insert(files).values({
        filePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
      })
    } catch (uploadErr: any) {
      console.error('R2 upload error:', uploadErr.message)
      return NextResponse.json({ error: 'File upload failed', details: uploadErr.message }, { status: 500 })
    }

    return NextResponse.json(
      { url: `/api/files/${filePath}`, path: filePath, fileName: file.name, size: file.size, mimeType },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
