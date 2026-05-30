import { NextResponse } from 'next/server'
import { db } from '@/db'
import { files } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getR2Object } from '@/lib/r2-storage'

function copyToArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

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

    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.filePath, filePath))

    if (!fileRecord) {
      console.warn(`[File Service] File record not found in Turso: ${filePath}`)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    let fileBuffer: ArrayBuffer

    if (fileRecord.fileContent) {
      const binary = atob(fileRecord.fileContent)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      fileBuffer = copyToArrayBuffer(bytes)
    } else {
      const object = await getR2Object(filePath)

      if (!object) {
        console.warn(`[File Service] File not found in R2: ${filePath}`)
        return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
      }

      fileBuffer = object
    }

    const mimeType = fileRecord.mimeType || 'application/octet-stream'
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', fileBuffer.byteLength.toString())

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
