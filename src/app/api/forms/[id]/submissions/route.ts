import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { forms, submissions, files, formFields } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getRedisClient, getSubmissionRateLimit } from '@/lib/upstash'
import { getAuthUserId, AuthError } from '@/lib/auth'
import nodemailer from 'nodemailer'
import { createHash, createDecipheriv, pbkdf2Sync } from 'node:crypto'

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

// ─── Encryption helpers ───────────────────────────────────────────────────────
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET ?? ''
const ENCRYPTION_PREFIX = 'enc:v2'
const NEW_ENCRYPTION_PREFIX = 'enc:v3'

function deriveCurrentKey(secret: string) {
  if (/^[0-9a-fA-F]{64}$/.test(secret)) return Buffer.from(secret, 'hex')
  return createHash('sha256').update(secret, 'utf8').digest()
}

function deriveLegacyKey(secret: string) {
  return pbkdf2Sync(secret, 'salt', 100, 32, 'sha1')
}

async function decryptWeb(payload: string, secret: string) {
  try {
    const parts = payload.split(':')
    if (parts.length < 3) return payload
    const [, ivPart, encryptedPart] = parts
    const enc = new TextEncoder()
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret))
    const key = await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['decrypt'])
    const fromBase64Url = (s: string) => {
      const b = s.replace(/-/g, '+').replace(/_/g, '/')
      const bin = atob(b)
      return new Uint8Array([...bin].map((c) => c.charCodeAt(0)))
    }
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(ivPart) }, key, fromBase64Url(encryptedPart))
    return new TextDecoder().decode(decrypted)
  } catch { return payload }
}

function decryptCurrent(text: string, secret: string) {
  const parts = text.split(':')
  if (parts.length < 5) return text
  try {
    const decipher = createDecipheriv('aes-256-gcm', deriveCurrentKey(secret), Buffer.from(parts[2], 'base64url'))
    decipher.setAuthTag(Buffer.from(parts[4], 'base64url'))
    return Buffer.concat([decipher.update(Buffer.from(parts[3], 'base64url')), decipher.final()]).toString('utf8')
  } catch { return text }
}

function decryptLegacy(text: string, secret: string) {
  const parts = text.split(':')
  const ivHex = parts.shift()
  const enc = parts.join(':')
  if (!ivHex || ivHex.length !== 32 || !enc) return text
  try {
    const decipher = createDecipheriv('aes-256-cbc', deriveLegacyKey(secret), Buffer.from(ivHex, 'hex'))
    return Buffer.concat([decipher.update(enc, 'base64'), decipher.final()]).toString('utf8')
  } catch { return text }
}

async function decryptValue(text: string): Promise<string> {
  if (!text || !ENCRYPTION_SECRET) return text ?? ''
  if (text.startsWith(`${NEW_ENCRYPTION_PREFIX}:`)) return await decryptWeb(text, ENCRYPTION_SECRET)
  if (text.startsWith(`${ENCRYPTION_PREFIX}:`)) return decryptCurrent(text, ENCRYPTION_SECRET)
  if (text.includes(':')) return decryptLegacy(text, ENCRYPTION_SECRET)
  return text
}

// ─── Integration runner ───────────────────────────────────────────────────────
async function runIntegrations(formConfig: any, submission: { id: string; formId: string; data: any; submittedAt: string }) {
  const data = submission.data as Record<string, any>
  const tasks: Promise<void>[] = []

  // SLACK
  if (formConfig.slackEnabled && formConfig.slackBotToken && formConfig.slackChannelId) {
    tasks.push((async () => {
      try {
        const token = await decryptValue(formConfig.slackBotToken)
        const fields = await db.select({ id: formFields.id, label: formFields.label }).from(formFields).where(eq(formFields.formId, formConfig.id))
        const blocks: any[] = [
          { type: 'header', text: { type: 'plain_text', text: 'New Submission' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*Form:* ${formConfig.title}\n*ID:* ${submission.id}` } },
        ]
        fields.forEach((f) => {
          const val = Array.isArray(data[f.id]) ? data[f.id].map((v: any) => v.url || v).join(', ') : data[f.id] || ''
          blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${f.label}:* ${val || '-(empty)-'}` } })
        })
        const res = await fetch('https://slack.com/api/chat.postMessage', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: formConfig.slackChannelId, blocks }) })
        if (res.ok) await db.update(submissions).set({ slackSynced: true }).where(eq(submissions.id, submission.id))
      } catch (e: any) { console.error('[Slack Error]', e.message) }
    })())
  }

  // ZAPIER
  if (formConfig.zapierEnabled && formConfig.zapierWebhookUrl) {
    tasks.push((async () => {
      try {
        const url = await decryptValue(formConfig.zapierWebhookUrl)
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submission_id: submission.id, ...data }) })
        if (res.ok) await db.update(submissions).set({ zapierSynced: true }).where(eq(submissions.id, submission.id))
      } catch (e: any) { console.error('[Zapier Error]', e.message) }
    })())
  }

  // AIRTABLE
  if (formConfig.airtableEnabled && formConfig.airtableApiKey && formConfig.airtableBaseId) {
    tasks.push((async () => {
      try {
        const key = await decryptValue(formConfig.airtableApiKey)
        const res = await fetch(`https://api.airtable.com/v0/${formConfig.airtableBaseId}/${encodeURIComponent(formConfig.airtableTableName || 'Submissions')}`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ records: [{ fields: { ...data, 'Submission Date': submission.submittedAt } }] }) })
        if (res.ok) await db.update(submissions).set({ airtableSynced: true }).where(eq(submissions.id, submission.id))
      } catch (e: any) { console.error('[Airtable Error]', e.message) }
    })())
  }

  // EMAIL
  if (formConfig.emailEnabled && formConfig.notificationEmail && formConfig.emailAppPassword) {
    tasks.push((async () => {
      try {
        const pass = await decryptValue(formConfig.emailAppPassword)
        const transporter = nodemailer.createTransport({ host: formConfig.emailHost || 'smtp.gmail.com', port: formConfig.emailPort || 465, secure: formConfig.emailSecure ?? true, auth: { user: formConfig.notificationEmail, pass } })
        await transporter.sendMail({ from: `"FormSync" <${formConfig.notificationEmail}>`, to: formConfig.emailToList || formConfig.notificationEmail, subject: `New Submission: ${formConfig.title}`, html: `<p>New submission for <b>${formConfig.title}</b>.</p><pre>${JSON.stringify(data, null, 2)}</pre>` })
        await db.update(submissions).set({ emailSynced: true }).where(eq(submissions.id, submission.id))
      } catch (e: any) { console.error('[Email Error]', e.message) }
    })())
  }

  // GOOGLE SHEETS
  if (formConfig.googleSheetEnabled && formConfig.googleSheetId) {
    tasks.push((async () => {
      try {
        const { getGoogleAccessToken } = await import('@/lib/google-sheets')
        const accessToken = await getGoogleAccessToken(formConfig.userId)
        if (accessToken) {
          const row = [new Date().toLocaleString(), ...Object.values(data)]
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${formConfig.googleSheetId}/values/${formConfig.googleSheetName || 'Sheet1'}:append?valueInputOption=USER_ENTERED`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [row] }) })
          if (res.ok) await db.update(submissions).set({ googleSynced: true }).where(eq(submissions.id, submission.id))
        }
      } catch (e: any) { console.error('[Google Sheets Error]', e.message) }
    })())
  }

  // NOTION
  if (formConfig.notionEnabled && formConfig.notionApiKey && formConfig.notionDatabaseId) {
    tasks.push((async () => {
      try {
        const { syncSubmissionToNotion } = await import('@/lib/notion')
        await syncSubmissionToNotion(formConfig.id, submission)
      } catch (e: any) { console.error('[Notion Error]', e.message) }
    })())
  }

  await Promise.allSettled(tasks)
}

// ─── GET: list submissions for dashboard ──────────────────────────────────────
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

// ─── POST: receive submission from public form ────────────────────────────────
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
          { status: 200 }
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

    // ── Load form (Redis cache → Turso fallback) ───────────────────────────────
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

    // ── Turnstile Verification ────────────────────────────────────────────────
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (turnstileSecret && turnstileSecret !== 'your_secret_key_here' && captchaToken) {
      try {
        const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${turnstileSecret}&response=${captchaToken}`,
        })
        const vData = await vRes.json()
        if (!vData.success) {
          return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 400 })
        }
      } catch (e: any) {
        console.warn('[Turnstile Error]', e.message)
      }
    }

    // ── Direct DB Insert ──────────────────────────────────────────────────────
    const subId = crypto.randomUUID()
    const submissionRecord = { id: subId, formId: id, data, submittedAt }
    await db.insert(submissions).values(submissionRecord)

    if (fileList.length > 0) {
      await db.insert(files).values(
        fileList.map((f: any) => ({
          submissionId: subId,
          filePath: f.path || f.url || '',
          fileName: f.fileName || f.name || 'unknown',
          fileSize: f.size || 0,
          mimeType: f.mimeType || f.mime_type || 'application/octet-stream',
        }))
      ).catch((e: any) => console.error('[File Insert Error]', e.message))
    }

    // Cache idempotency if Redis is active
    if (idempotencyKey && redis) {
      await redis.setex(`idempotency:${idempotencyKey}`, 600, subId).catch(() => null)
    }

    // ── Trigger integrations synchronously/wait for completion ─────────────────
    await runIntegrations(form, submissionRecord).catch((e) => {
      console.error('[Integrations Error]', e)
    })

    return NextResponse.json(
      { success: true, message: 'Submission received successfully.', submission_id: subId },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
