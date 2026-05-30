type CloudflareEnv = Record<string, unknown>

type R2ObjectBody = {
  arrayBuffer: () => Promise<ArrayBuffer>
}

type R2BucketLike = {
  put: (
    key: string,
    value: ArrayBuffer | Uint8Array | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } }
  ) => Promise<unknown>
  get: (key: string) => Promise<R2ObjectBody | null>
}

const R2_BINDING_NAMES = ['FORM_UPLOADS_R2', 'R2_BUCKET', 'UPLOADS_BUCKET']

function copyToArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

async function getCloudflareEnv(): Promise<CloudflareEnv> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const context = await getCloudflareContext({ async: true })
    return (context.env ?? {}) as CloudflareEnv
  } catch {
    return {}
  }
}

function getStringEnv(env: CloudflareEnv, key: string) {
  const value = env[key] ?? process.env[key]
  return typeof value === 'string' ? value.trim() : undefined
}

function getR2Binding(env: CloudflareEnv): R2BucketLike | null {
  for (const name of R2_BINDING_NAMES) {
    const binding = env[name]
    if (
      binding &&
      typeof binding === 'object' &&
      typeof (binding as R2BucketLike).put === 'function' &&
      typeof (binding as R2BucketLike).get === 'function'
    ) {
      return binding as R2BucketLike
    }
  }

  return null
}

export async function putR2Object(key: string, body: ArrayBuffer, contentType: string) {
  const env = await getCloudflareEnv()
  const bucketBinding = getR2Binding(env)

  if (bucketBinding) {
    await bucketBinding.put(key, body, {
      httpMetadata: { contentType },
    })
    return
  }

  const accountId = getStringEnv(env, 'CLOUDFLARE_R2_ACCOUNT_ID')
  const bucket = getStringEnv(env, 'CLOUDFLARE_R2_BUCKET')
  const accessKeyId = getStringEnv(env, 'CLOUDFLARE_R2_ACCESS_KEY_ID')
  const secretAccessKey = getStringEnv(env, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY')

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 is not configured. Add an R2 binding or S3-compatible R2 credentials.')
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: new Uint8Array(body),
    ContentType: contentType,
  }))
}

export async function getR2Object(key: string) {
  const env = await getCloudflareEnv()
  const bucketBinding = getR2Binding(env)

  if (bucketBinding) {
    const object = await bucketBinding.get(key)
    if (!object) return null
    return object.arrayBuffer()
  }

  const accountId = getStringEnv(env, 'CLOUDFLARE_R2_ACCOUNT_ID')
  const bucket = getStringEnv(env, 'CLOUDFLARE_R2_BUCKET')
  const accessKeyId = getStringEnv(env, 'CLOUDFLARE_R2_ACCESS_KEY_ID')
  const secretAccessKey = getStringEnv(env, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY')

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 is not configured. Add an R2 binding or S3-compatible R2 credentials.')
  }

  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  const s3Response = await s3Client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }))

  if (!s3Response.Body) return null
  const byteArray = await s3Response.Body.transformToByteArray()
  return copyToArrayBuffer(byteArray)
}
