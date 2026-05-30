import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forms, files } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

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

/**
 * File upload endpoint.
 * Since we no longer have Supabase Storage, files are stored in Cloudflare R2 or
 * a public bucket. For now, we return a local path reference and let the caller
 * handle persistence via the submissions API.
 * 
 * To use Cloudflare R2, set CLOUDFLARE_R2_* env vars.
 * If none configured, we return a placeholder path.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    const formData = await request.formData()
    const file = formData.get('file')
    const formId = formData.get('formId')

    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (typeof formId !== 'string' || !formId) return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })

    const [form] = await db.select({ id: forms.id, userId: forms.userId, published: forms.published }).from(forms).where(eq(forms.id, formId))
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    const isOwner = Boolean(userId && userId === form.userId)
    if (!form.published && !isOwner) return NextResponse.json({ error: 'Files can only be uploaded to published forms' }, { status: 403 })
    if (file.size > MAX_FILE_SIZE_BYTES) return NextResponse.json({ error: 'File is too large. Maximum size is 50MB.' }, { status: 400 })
    if (!isAllowedFileType(file)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })

    const safeFileName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
    const filePath = `${form.id}/${safeFileName}`

    // ── Cloudflare R2 upload ──────────────────────────────────────────────────
    const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim()
    const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET?.trim()
    const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim()
    const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim()
    const R2_TOKEN = process.env.CLOUDFLARE_R2_TOKEN?.trim()
    const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim()

    if (R2_ACCOUNT_ID && R2_BUCKET) {
      if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
        // Method 1: AWS S3 SDK
        try {
          const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: R2_ACCESS_KEY_ID,
              secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
          })

          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)

          await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: filePath,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
          }))

          const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${filePath}` : filePath
          return NextResponse.json({ url: publicUrl, path: filePath, fileName: file.name, size: file.size, mimeType: file.type || 'application/octet-stream' }, { status: 201 })
        } catch (r2Error: any) {
          console.error('R2 S3 upload error:', r2Error.message)
          return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
        }
      } else if (R2_TOKEN) {
        // Method 2: Cloudflare REST API using Bearer Token
        try {
          const bytes = await file.arrayBuffer()
          const uploadRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${filePath}`,
            {
              method: 'PUT',
              headers: { Authorization: `Bearer ${R2_TOKEN}`, 'Content-Type': file.type || 'application/octet-stream' },
              body: bytes,
            }
          )

          if (!uploadRes.ok) {
            console.error('R2 REST upload error:', await uploadRes.text())
            return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
          }

          const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${filePath}` : filePath
          return NextResponse.json({ url: publicUrl, path: filePath, fileName: file.name, size: file.size, mimeType: file.type || 'application/octet-stream' }, { status: 201 })
        } catch (r2Error: any) {
          console.error('R2 REST upload error:', r2Error.message)
          return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
        }
      }
    }

    // Fallback: save to DB as base64 reference (useful in dev / no R2 storage configured)
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      await db.insert(files).values({
        filePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        fileContent: base64,
      })
    } catch (dbErr: any) {
      console.error('Failed to save file to DB fallback:', dbErr.message)
      return NextResponse.json({ error: 'File save failed' }, { status: 500 })
    }

    return NextResponse.json({ url: `/api/files/${filePath}`, path: filePath, fileName: file.name, size: file.size, mimeType: file.type || 'application/octet-stream' }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
