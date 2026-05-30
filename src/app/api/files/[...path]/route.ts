import { NextResponse } from 'next/server'
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

    if (!fileRecord || !fileRecord.fileContent) {
      console.warn(`[File Service] File not found or has no content: ${filePath}`)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Decode base64 content back into raw bytes
    const fileBuffer = Buffer.from(fileRecord.fileContent, 'base64')

    // Construct responses headers
    const mimeType = fileRecord.mimeType || 'application/octet-stream'
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', fileBuffer.length.toString())
    
    // Set to 'inline' so browser displays it directly (e.g. PDFs, images)
    const encodedFileName = encodeURIComponent(fileRecord.fileName)
    headers.set('Content-Disposition', `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error('[File Service Error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
