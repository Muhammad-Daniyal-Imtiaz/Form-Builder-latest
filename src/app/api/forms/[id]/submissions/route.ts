import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { forms, submissions, files } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getRedisClient, getSubmissionRateLimit } from '@/lib/upstash'
import { getAuthUserId, AuthError } from '@/lib/auth'

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
    'anonymous'
  )
}

// ─── GET: list submissions (dashboard) ───────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()

    const [form] = await db
      .select({ id: forms.id })
      .from(forms)
      .where(and(eq(forms.id, id), eq(forms.userId, userId)))

    if (!form) return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 })

    const subs = await db
      .select()
      .from(submissions)
      .where(eq(submissions.formId, id))
      .orderBy(desc(submissions.submittedAt))

    return NextResponse.json(subs)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('GET submissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST: receive submission (public form) ───────────────────────────────────
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

    // ── Idempotency check ─────────────────────────────────────────────────────
    if (idempotencyKey && redis) {
      const existing = await redis.get<string>(`idempotency:${idempotencyKey}`).catch(() => null)
      if (existing) {
        return NextResponse.json(
          { success: true, message: 'Submission already received.', submission_id: existing },
          { status: 202 }
        )
      }
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    if (ratelimit) {
      try {
        const { success, limit, reset, remaining } = await ratelimit.limit(`${id}:${clientIp}`)
        if (!success) {
          return NextResponse.json(
            { error: 'Too many submissions. Please try again in 10 minutes.' },
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
      } catch (e) {
        console.warn('Rate limit check failed, bypassing:', e)
      }
    }

    // ── Validate body ─────────────────────────────────────────────────────────
    const body = await request.json()
    const parsed = submissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request format', details: parsed.error.format() }, { status: 400 })
    }

    const { data, files: fileList = [], captchaToken } = parsed.data

    // ── Load form (try Redis cache first) ─────────────────────────────────────
    const cacheKey = `form:${id}:meta`
    let form: any = null

    if (redis) {
      const cached = await redis.get<any>(cacheKey).catch(() => null)
      if (cached) form = typeof cached === 'string' ? JSON.parse(cached) : cached
    }

    if (!form) {
      const [dbForm] = await db.select().from(forms).where(eq(forms.id, id))
      if (!dbForm) return NextResponse.json({ error: 'Form not found' }, { status: 404 })
      form = dbForm
      if (redis) await redis.setex(cacheKey, 60, JSON.stringify(form)).catch(() => null)
    }

    if (!form.published) {
      return NextResponse.json({ error: 'Form is not accepting submissions' }, { status: 403 })
    }

    // ── Turnstile captcha (optional) ──────────────────────────────────────────
    if (
      process.env.TURNSTILE_SECRET_KEY &&
      process.env.TURNSTILE_SECRET_KEY !== 'your_secret_key_here' &&
      captchaToken
    ) {
      try {
        const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${captchaToken}`,
        })
        const vData = await vRes.json()
        if (!vData.success) {
          return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 400 })
        }
      } catch (e) {
        console.warn('Turnstile verification failed, allowing submission:', e)
      }
    }

    // ── Insert submission directly into Turso ─────────────────────────────────
    const subId = crypto.randomUUID()
    await db.insert(submissions).values({
      id: subId,
      formId: id,
      data,
      submittedAt,
    })

    // ── Insert file records if any ────────────────────────────────────────────
    if (fileList.length > 0) {
      await db.insert(files).values(
        fileList.map((f: any) => ({
          submissionId: subId,
          filePath: f.path || f.url || '',
          fileName: f.fileName || f.name || 'unknown',
          fileSize: f.size || 0,
          mimeType: f.mimeType || f.mime_type || 'application/octet-stream',
        }))
      ).catch((e: any) => console.error('File insert error:', e.message))
    }

    // ── Store idempotency key ─────────────────────────────────────────────────
    if (idempotencyKey && redis) {
      await redis.setex(`idempotency:${idempotencyKey}`, 600, subId).catch(() => null)
    }

    // ── Enqueue integrations asynchronously via Redis (best-effort) ───────────
    if (redis) {
      const msgId = crypto.randomUUID()
      const payload = {
        msg_id: msgId,
        form_id: id,
        submission_id: subId,
        data,
        files: fileList,
        submitted_at: submittedAt,
        client_ip: clientIp,
        // Mark as already saved — processor should only run integrations
        already_saved: true,
      }
      redis.lpush('form_integrations_queue', JSON.stringify(payload)).catch(() => null)
    }

    return NextResponse.json(
      { success: true, message: 'Submission received successfully.', submission_id: subId },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
