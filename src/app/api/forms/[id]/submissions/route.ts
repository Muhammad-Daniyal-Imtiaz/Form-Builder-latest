import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getRedisClient, getSubmissionRateLimit } from '@/lib/upstash'
import { createAdminClient, createClient } from '@/utils/supabase/server'

const submissionSchema = z.object({
  data: z.record(z.string(), z.any()),
  files: z.array(z.any()).optional(),
  captchaToken: z.string().optional(),
})

function getClientIp(request: Request) {
  return (
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    (request as any).ip ||
    'anonymous'
  )
}

async function insertSubmissionDirect(
  formId: string,
  data: Record<string, unknown>,
  files: any[],
  submittedAt: string
) {
  const adminClient = createAdminClient()

  const { data: insertedSubmission, error: insertError } = await adminClient
    .from('submissions')
    .insert({
      form_id: formId,
      data,
      submitted_at: submittedAt,
    })
    .select('id')
    .single()

  if (insertError) {
    throw insertError
  }

  if (files.length > 0) {
    const fileRecords = files.map((file) => ({
      submission_id: insertedSubmission.id,
      file_path: file.path,
      file_name: file.fileName || 'unknown',
      file_size: file.size || 0,
      mime_type: file.mimeType || file.mime_type || 'application/octet-stream',
    }))

    const { error: fileInsertError } = await adminClient.from('files').insert(fileRecords)
    if (fileInsertError) {
      throw fileInsertError
    }
  }

  return insertedSubmission.id
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 })
    }

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('form_id', id)
      .order('submitted_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('GET submissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientIp = getClientIp(request)
    const idempotencyKey = request.headers.get('idempotency-key')
    const submittedAt = new Date().toISOString()
    const redis = getRedisClient()
    const ratelimit = getSubmissionRateLimit()

    if (idempotencyKey && redis) {
      const existingMessageId = await redis.get<string>(`idempotency:${idempotencyKey}`)
      if (existingMessageId) {
        return NextResponse.json(
          {
            success: true,
            message: 'Submission received (idempotent retry).',
            queue_id: existingMessageId,
          },
          { status: 202 }
        )
      }
    }

    if (ratelimit) {
      try {
        const { success, limit, reset, remaining } = await ratelimit.limit(`${id}:${clientIp}`)
        if (!success) {
          return NextResponse.json(
            {
              error: 'Too many submissions for this form. Please try again in 10 minutes.',
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
              },
            }
          )
        }
      } catch (rateLimitError) {
        console.warn('Rate limit check failed, bypassing:', rateLimitError)
      }
    }

    const body = await request.json()
    const parsedBody = submissionSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const { data, files = [], captchaToken } = parsedBody.data
    const cacheKey = `form:${id}:meta`
    let form: any = null

    if (redis) {
      const cachedForm = await redis.get<any>(cacheKey).catch(() => null)
      if (cachedForm) {
        form = typeof cachedForm === 'string' ? JSON.parse(cachedForm) : cachedForm
      }
    }

    if (!form) {
      const adminClient = createAdminClient()
      const { data: dbForm, error: formError } = await adminClient
        .from('forms')
        .select('*')
        .eq('id', id)
        .single()

      if (formError || !dbForm) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 })
      }

      form = dbForm
      if (redis) {
        await redis.setex(cacheKey, 60, JSON.stringify(form)).catch(() => null)
      }
    }

    if (!form.published) {
      return NextResponse.json({ error: 'Form is not accepting submissions' }, { status: 403 })
    }

    if (
      process.env.TURNSTILE_SECRET_KEY &&
      process.env.TURNSTILE_SECRET_KEY !== 'your_secret_key_here' &&
      !captchaToken
    ) {
      return NextResponse.json({ error: 'Security check required' }, { status: 400 })
    }

    if (redis) {
      const msgId = crypto.randomUUID()
      const payload = {
        msg_id: msgId,
        form_id: id,
        data,
        files,
        captchaToken,
        submitted_at: submittedAt,
        client_ip: clientIp,
      }

      try {
        const multi = redis.multi()
        multi.lpush('form_submissions_queue', JSON.stringify(payload))
        multi.hset(`msg:${msgId}`, { status: 'queued', formId: id, ts: Date.now() })
        multi.expire(`msg:${msgId}`, 86400)

        if (idempotencyKey) {
          multi.setex(`idempotency:${idempotencyKey}`, 600, msgId)
        }

        await multi.exec()

        return NextResponse.json(
          {
            success: true,
            message: 'Submission received and is being processed.',
            queue_id: msgId,
          },
          { status: 202 }
        )
      } catch (redisError) {
        console.warn('Redis enqueue failed, falling back to direct DB insert:', redisError)
      }
    }

    const submissionId = await insertSubmissionDirect(id, data, files, submittedAt)

    return NextResponse.json(
      {
        success: true,
        message: 'Submission received successfully.',
        submission_id: submissionId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
