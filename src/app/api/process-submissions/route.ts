/**
 * Submission Processor — replaces the Supabase Edge Function.
 * Can be triggered by:
 *  - Upstash QStash (HTTP POST with cron/webhook)
 *  - A manual POST to /api/process-submissions
 *
 * It drains the Redis queue `form_submissions_queue`, verifies Turnstile,
 * bulk-inserts into Turso via Drizzle, then fires all integrations.
 */

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forms, submissions, formFields, files } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { decrypt } from '@/utils/encryption'
import nodemailer from 'nodemailer'
import { createHash, createDecipheriv, pbkdf2Sync } from 'crypto'

// ─── Auth guard for cron/internal calls ──────────────────────────────────────
const PROCESSOR_SECRET = process.env.PROCESSOR_SECRET ?? ''

// ─── Encryption helpers (same as edge function) ──────────────────────────────
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

// ─── Redis helpers ────────────────────────────────────────────────────────────
const DEAD_LETTER_QUEUE = 'form_submissions_dead_letter'

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Missing Upstash credentials')
  const headers = { Authorization: `Bearer ${token}` }

  return {
    async lmove(src: string, dst: string) {
      const res = await fetch(`${url}/lmove/${encodeURIComponent(src)}/${encodeURIComponent(dst)}/RIGHT/LEFT`, { method: 'POST', headers })
      return (await res.json()).result
    },
    async hset(key: string, field: string, value: string) {
      await fetch(`${url}/hset/${encodeURIComponent(key)}/${encodeURIComponent(field)}/${encodeURIComponent(value)}`, { method: 'POST', headers })
    },
    async hget(key: string, field: string) {
      const res = await fetch(`${url}/hget/${encodeURIComponent(key)}/${encodeURIComponent(field)}`, { method: 'POST', headers })
      return (await res.json()).result
    },
    async del(key: string) {
      await fetch(`${url}/del/${encodeURIComponent(key)}`, { method: 'POST', headers })
    },
    async lpush(key: string, value: string) {
      await fetch(`${url}/lpush/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, { method: 'POST', headers })
    },
    async get(key: string) {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, { method: 'POST', headers })
      return (await res.json()).result
    },
    async setex(key: string, ttl: number, value: string) {
      await fetch(`${url}/setex/${encodeURIComponent(key)}/${ttl}/${encodeURIComponent(value)}`, { method: 'POST', headers })
    },
  }
}

async function pushDeadLetter(redis: ReturnType<typeof getRedis>, item: any, error: string) {
  const payload = { ...item, error, failed_at: Date.now(), retry_count: (item?.retry_count || 0) + 1 }
  await redis.lpush(DEAD_LETTER_QUEUE, JSON.stringify(payload)).catch(() => {})
  if (item?.msg_id) await redis.hset(`msg:${item.msg_id}`, 'status', 'failed').catch(() => {})
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

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Verify internal secret
  const authHeader = request.headers.get('authorization')
  if (PROCESSOR_SECRET && authHeader !== `Bearer ${PROCESSOR_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const workerId = crypto.randomUUID()
  const MAX_RUNTIME_MS = 25000 // 25s safe limit for serverless
  let totalProcessed = 0

  try {
    const redis = getRedis()
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    const processingList = `processing:${workerId}`

    while (Date.now() - startTime < MAX_RUNTIME_MS) {
      const batch: any[] = []

      for (let i = 0; i < 50; i++) {
        const raw = await redis.lmove('form_submissions_queue', processingList)
        if (!raw) break

        try {
          const item = typeof raw === 'string' ? JSON.parse(raw) : raw
          if (!item?.msg_id) { await pushDeadLetter(redis, { raw }, 'Missing msg_id'); continue }
          const status = await redis.hget(`msg:${item.msg_id}`, 'status')
          if (status === 'completed') { console.warn(`[Worker] Skipping completed msg:${item.msg_id}`); continue }
          batch.push(item)
        } catch {
          await pushDeadLetter(redis, { raw }, 'Invalid queue payload')
        }
      }

      if (!batch.length) break

      // Turnstile verification
      const verified = await Promise.all(batch.map(async (item) => {
        await redis.hset(`msg:${item.msg_id}`, 'status', 'processing')
        if (turnstileSecret && turnstileSecret !== 'your_secret_key_here' && item.captchaToken) {
          try {
            const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `secret=${turnstileSecret}&response=${item.captchaToken}` })
            const vData = await vRes.json()
            if (!vData.success) {
              await pushDeadLetter(redis, item, `Turnstile failed: ${JSON.stringify(vData['error-codes'] || [])}`)
              return null
            }
          } catch { /* allow on network error */ }
        }
        return item
      }))

      const validItems = verified.filter(Boolean)
      if (!validItems.length) { await redis.del(processingList); continue }

      // Bulk insert submissions
      const subValues = validItems.map((item) => ({ id: crypto.randomUUID(), formId: item.form_id, data: item.data, submittedAt: item.submitted_at || new Date().toISOString() }))

      try {
        await db.insert(submissions).values(subValues)
      } catch (err: any) {
        console.error('[Worker] Bulk insert error:', err.message)
        await Promise.all(validItems.map((item) => pushDeadLetter(redis, item, `DB insert failed: ${err.message}`)))
        await redis.del(processingList)
        continue
      }

      // Insert files
      const fileRecords: any[] = []
      subValues.forEach((sub, idx) => {
        const item = validItems[idx]
        if (Array.isArray(item.files)) {
          item.files.forEach((f: any) => fileRecords.push({ submissionId: sub.id, filePath: f.path, fileName: f.fileName || 'unknown', fileSize: f.size || 0, mimeType: f.mimeType || 'application/octet-stream' }))
        }
      })
      if (fileRecords.length > 0) {
        await db.insert(files).values(fileRecords).catch((e: any) => console.error('[Worker] File insert error:', e.message))
      }

      // Load form configs (cached in Redis)
      const uniqueFormIds = [...new Set(validItems.map((i) => i.form_id))]
      const configMap = new Map<string, any>()

      for (const fid of uniqueFormIds) {
        const cached = await redis.get(`form:${fid}:meta`).catch(() => null)
        if (cached) {
          try { configMap.set(fid, typeof cached === 'string' ? JSON.parse(cached) : cached); continue } catch { }
        }
        const [dbForm] = await db.select().from(forms).where(eq(forms.id, fid))
        if (dbForm) {
          configMap.set(fid, dbForm)
          await redis.setex(`form:${fid}:meta`, 60, JSON.stringify(dbForm)).catch(() => {})
        }
      }

      // Run integrations and mark complete
      await Promise.allSettled(subValues.map(async (sub, idx) => {
        const formConfig = configMap.get(sub.formId)
        const item = validItems[idx]
        if (formConfig) await runIntegrations(formConfig, sub).catch((e: any) => console.error(`[Worker] Integration failed:`, e.message))
        await redis.hset(`msg:${item.msg_id}`, 'status', 'completed')
      }))

      totalProcessed += validItems.length
      await redis.del(processingList)
    }

    console.log(`[Worker] Done. Processed: ${totalProcessed}`)
    return NextResponse.json({ success: true, processed: totalProcessed })
  } catch (err: any) {
    console.error('[Worker] Global Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', time: new Date().toISOString() })
}
