import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { db } from '@/db'
import { files } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    const filePath = path.join('/')

    // Query Turso for the file record
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.filePath, filePath))

    if (!fileRecord) {
      console.warn(`[File Service] File record not found in Turso: ${filePath}`)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    let fileBuffer: Buffer

    if (fileRecord.fileContent) {
      // Decode base64 content back into raw bytes from Turso
      fileBuffer = Buffer.from(fileRecord.fileContent, 'base64')
    } else {
      // Fetch from Cloudflare R2 using the S3 client
      const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim()
      const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET?.trim()
      const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim()
      const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim()

      if (R2_ACCOUNT_ID && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
        try {
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: R2_ACCESS_KEY_ID,
              secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
          })

          const s3Response = await s3Client.send(new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: filePath,
          }))

          if (!s3Response.Body) {
            throw new Error('S3 response body is empty')
          }
          const byteArray = await s3Response.Body.transformToByteArray()
          fileBuffer = Buffer.from(byteArray)
        } catch (r2Err: any) {
          console.error('[File Service R2 Error]', r2Err.message)
          return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 500 })
        }
      } else {
        console.warn(`[File Service] R2 credentials not configured to fetch R2 stored file: ${filePath}`)
        return NextResponse.json({ error: 'File storage configuration missing' }, { status: 404 })
      }
    }

    // Construct response headers
    const mimeType = fileRecord.mimeType || 'application/octet-stream'
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', fileBuffer.length.toString())
    
    // Set to 'inline' so browser displays it directly (e.g. PDFs, images)
    const encodedFileName = encodeURIComponent(fileRecord.fileName)
    headers.set('Content-Disposition', `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error('[File Service Error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
