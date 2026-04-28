import { NextResponse } from 'next/server'

import { createAdminClient, createClient } from '@/utils/supabase/server'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

function isAllowedFileType(file: File) {
  if (ALLOWED_FILE_TYPES.has(file.type)) {
    return true
  }

  return (
    file.type.startsWith('image/') ||
    file.type.startsWith('audio/') ||
    file.type.startsWith('video/')
  )
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const formData = await request.formData()
    const file = formData.get('file')
    const formId = formData.get('formId')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (typeof formId !== 'string' || !formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    const { data: form, error: formError } = await adminClient
      .from('forms')
      .select('id, user_id, published')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const isOwner = Boolean(user?.id && user.id === form.user_id)
    if (!form.published && !isOwner) {
      return NextResponse.json(
        { error: 'Files can only be uploaded to published forms' },
        { status: 403 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    if (!isAllowedFileType(file)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    const safeFileName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
    const filePath = `${form.id}/${safeFileName}`

    const { error } = await adminClient.storage
      .from('form-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
    }

    const { data: publicData } = adminClient.storage
      .from('form-attachments')
      .getPublicUrl(filePath)

    return NextResponse.json(
      {
        url: publicData.publicUrl,
        path: filePath,
        fileName: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
