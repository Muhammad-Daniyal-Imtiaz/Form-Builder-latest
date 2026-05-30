/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Form Builder — Submission Processor (Cloudflare Worker)         ║
 * ║  Replaces Supabase Edge Function                                 ║
 * ║  • Drains Redis queue → inserts into Turso (libsql)              ║
 * ║  • Fires all integrations (Slack, Zapier, Airtable, Email, GSheets, Notion) ║
 * ║  • Runs on cron every 2 minutes (wrangler.toml)                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@libsql/client/web';

// ─── Cloudflare Worker types (avoids dependency on @cloudflare/workers-types globals) ──
interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
  noRetry(): void;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}


// ─── Env Interface ────────────────────────────────────────────────────────────
export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  ENCRYPTION_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  PROCESSOR_SECRET?: string;
}

// ─── Turso DB Client ──────────────────────────────────────────────────────────
function getDb(env: Env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

// ─── Redis REST Helper ────────────────────────────────────────────────────────
function getRedis(env: Env) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  /** Typed wrapper so we never touch `unknown` directly */
  async function rjson(res: Response): Promise<{ result: any }> {
    return res.json() as Promise<{ result: any }>;
  }

  return {
    async lmove(src: string, dst: string): Promise<any> {
      const res = await fetch(`${url}/lmove/${encodeURIComponent(src)}/${encodeURIComponent(dst)}/RIGHT/LEFT`, {
        method: 'POST', headers,
      });
      return (await rjson(res)).result;
    },
    async lpush(key: string, value: string): Promise<void> {
      await fetch(`${url}/lpush/${encodeURIComponent(key)}`, {
        method: 'POST', headers, body: JSON.stringify([value]),
      });
    },
    async hset(key: string, field: string, value: string): Promise<void> {
      await fetch(`${url}/hset/${encodeURIComponent(key)}/${encodeURIComponent(field)}/${encodeURIComponent(value)}`, {
        method: 'POST', headers,
      });
    },
    async hget(key: string, field: string): Promise<string | null> {
      const res = await fetch(`${url}/hget/${encodeURIComponent(key)}/${encodeURIComponent(field)}`, {
        method: 'POST', headers,
      });
      return (await rjson(res)).result as string | null;
    },
    async get(key: string): Promise<any> {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        method: 'POST', headers,
      });
      return (await rjson(res)).result;
    },
    async setex(key: string, ttl: number, value: string): Promise<void> {
      await fetch(`${url}/setex/${encodeURIComponent(key)}/${ttl}/${encodeURIComponent(value)}`, {
        method: 'POST', headers,
      });
    },
    async del(key: string): Promise<void> {
      await fetch(`${url}/del/${encodeURIComponent(key)}`, {
        method: 'POST', headers,
      });
    },
  };
}


// ─── Encryption ───────────────────────────────────────────────────────────────
const ENCRYPTION_PREFIX = 'enc:v2';
const NEW_ENCRYPTION_PREFIX = 'enc:v3';

async function decryptWeb(payload: string, secret: string): Promise<string> {
  try {
    const parts = payload.split(':');
    if (parts.length < 3) return payload;
    const [, ivPart, encryptedPart] = parts;
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret));
    const key = await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['decrypt']);
    const fromBase64Url = (s: string) => {
      const b = s.replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(b);
      return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
    };
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(ivPart) },
      key,
      fromBase64Url(encryptedPart)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return payload;
  }
}

async function decryptValue(text: string, secret: string): Promise<string> {
  if (!text || !secret) return text ?? '';
  if (text.startsWith(`${NEW_ENCRYPTION_PREFIX}:`)) return decryptWeb(text, secret);
  // Legacy formats — just return as-is for web worker (no node:crypto)
  return text;
}

// ─── Dead Letter Queue ────────────────────────────────────────────────────────
const DEAD_LETTER_QUEUE = 'form_submissions_dead_letter';
async function pushDeadLetter(redis: ReturnType<typeof getRedis>, item: any, error: string) {
  const payload = {
    ...item,
    error,
    failed_at: Date.now(),
    retry_count: (item?.retry_count || 0) + 1,
  };
  await redis.lpush(DEAD_LETTER_QUEUE, JSON.stringify(payload)).catch(() => {});
  if (item?.msg_id) await redis.hset(`msg:${item.msg_id}`, 'status', 'failed').catch(() => {});
}

// ─── Integration Runner ───────────────────────────────────────────────────────
async function runIntegrations(
  env: Env,
  db: ReturnType<typeof getDb>,
  formConfig: Record<string, any>,
  submissionId: string,
  data: Record<string, any>
) {
  const tasks: Promise<void>[] = [];
  const secret = env.ENCRYPTION_SECRET;

  // ── SLACK ──────────────────────────────────────────────────────────────────
  if (formConfig.slack_enabled && formConfig.slack_bot_token && formConfig.slack_channel_id) {
    tasks.push((async () => {
      try {
        const token = await decryptValue(formConfig.slack_bot_token, secret);
        // Fetch fields from Turso
        const fieldsResult = await db.execute({
          sql: 'SELECT id, label FROM form_fields WHERE form_id = ?',
          args: [formConfig.id],
        });
        const blocks: any[] = [
          { type: 'header', text: { type: 'plain_text', text: '🔔 New Form Submission' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*Form:* ${formConfig.title}\n*ID:* ${submissionId}` } },
        ];
        for (const row of fieldsResult.rows) {
          const val = data[row.id as string] || data[row.label as string] || '';
          const display = Array.isArray(val) ? val.map((v: any) => v.url || v).join(', ') : String(val || '-(empty)-');
          blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${row.label}:* ${display}` } });
        }
        const res = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: formConfig.slack_channel_id, blocks }),
        });
        if (res.ok) {
          await db.execute({ sql: 'UPDATE submissions SET slack_synced = 1 WHERE id = ?', args: [submissionId] });
        }
      } catch (e: any) { console.error('[Slack Error]', e.message); }
    })());
  }

  // ── ZAPIER ─────────────────────────────────────────────────────────────────
  if (formConfig.zapier_enabled && formConfig.zapier_webhook_url) {
    tasks.push((async () => {
      try {
        const url = await decryptValue(formConfig.zapier_webhook_url, secret);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submissionId, ...data }),
        });
        if (res.ok) {
          await db.execute({ sql: 'UPDATE submissions SET zapier_synced = 1 WHERE id = ?', args: [submissionId] });
        }
      } catch (e: any) { console.error('[Zapier Error]', e.message); }
    })());
  }

  // ── AIRTABLE ───────────────────────────────────────────────────────────────
  if (formConfig.airtable_enabled && formConfig.airtable_api_key && formConfig.airtable_base_id) {
    tasks.push((async () => {
      try {
        const key = await decryptValue(formConfig.airtable_api_key, secret);
        const res = await fetch(
          `https://api.airtable.com/v0/${formConfig.airtable_base_id}/${encodeURIComponent(formConfig.airtable_table_name || 'Submissions')}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: [{ fields: { ...data, 'Submission Date': new Date().toISOString() } }] }),
          }
        );
        if (res.ok) {
          await db.execute({ sql: 'UPDATE submissions SET airtable_synced = 1 WHERE id = ?', args: [submissionId] });
        }
      } catch (e: any) { console.error('[Airtable Error]', e.message); }
    })());
  }

  // ── GOOGLE SHEETS ──────────────────────────────────────────────────────────
  if (formConfig.google_sheet_enabled && formConfig.google_sheet_id && formConfig.user_id) {
    tasks.push((async () => {
      try {
        const accessToken = await getGoogleAccessToken(env, db, formConfig.user_id);
        if (accessToken) {
          const sheetName = formConfig.google_sheet_name || 'Sheet1';
          const row = [new Date().toLocaleString(), ...Object.values(data)];
          const res = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${formConfig.google_sheet_id}/values/${sheetName}:append?valueInputOption=USER_ENTERED`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: [row] }),
            }
          );
          if (res.ok) {
            await db.execute({ sql: 'UPDATE submissions SET google_synced = 1 WHERE id = ?', args: [submissionId] });
          }
        }
      } catch (e: any) { console.error('[Google Sheets Error]', e.message); }
    })());
  }

  // ── NOTION ─────────────────────────────────────────────────────────────────
  if (formConfig.notion_enabled && formConfig.notion_api_key && formConfig.notion_database_id) {
    tasks.push((async () => {
      try {
        const notionKey = await decryptValue(formConfig.notion_api_key, secret);
        // Build simple Notion properties
        const properties: Record<string, any> = {
          'Submission ID': { rich_text: [{ text: { content: submissionId } }] },
          'Date': { date: { start: new Date().toISOString() } },
        };
        for (const [k, v] of Object.entries(data)) {
          const strVal = Array.isArray(v) ? v.join(', ') : String(v ?? '');
          properties[k] = { rich_text: [{ text: { content: strVal.substring(0, 2000) } }] };
        }
        const res = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${notionKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { database_id: formConfig.notion_database_id },
            properties,
          }),
        });
        if (res.ok) {
          await db.execute({ sql: 'UPDATE submissions SET notion_synced = 1 WHERE id = ?', args: [submissionId] });
        }
      } catch (e: any) { console.error('[Notion Error]', e.message); }
    })());
  }

  await Promise.allSettled(tasks);
}

// ─── Google Token Helper ──────────────────────────────────────────────────────
async function getGoogleAccessToken(env: Env, db: ReturnType<typeof getDb>, userId: string): Promise<string | null> {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM user_integrations WHERE user_id = ? AND provider = 'google' LIMIT 1",
      args: [userId],
    });
    if (!result.rows.length) return null;
    const integration = result.rows[0] as any;

    const isExpired = !integration.expires_at || new Date(integration.expires_at).getTime() < Date.now() + 5 * 60 * 1000;
    if (!isExpired) return integration.access_token as string;

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !integration.refresh_token) return null;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token as string,
        grant_type: 'refresh_token',
      }),
    });
    const d = await res.json() as any;
    if (!res.ok) return null;

    await db.execute({
      sql: 'UPDATE user_integrations SET access_token = ?, expires_at = ? WHERE id = ?',
      args: [d.access_token, new Date(Date.now() + d.expires_in * 1000).toISOString(), integration.id as string],
    });
    return d.access_token;
  } catch (e: any) {
    console.error('[Google Token Error]', e.message);
    return null;
  }
}

// ─── Main Worker ──────────────────────────────────────────────────────────────
export default {
  // Triggered by HTTP (e.g. from the Next.js app or manually)
  async fetch(request: Request, env: Env): Promise<Response> {
    // Verify caller secret
    if (env.PROCESSOR_SECRET) {
      const auth = request.headers.get('authorization');
      if (auth !== `Bearer ${env.PROCESSOR_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
    }
    const result = await processQueue(env);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  // Triggered by cron (every 2 minutes per wrangler.toml)
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(processQueue(env));
  },
};

// ─── Core Queue Processor ─────────────────────────────────────────────────────
async function processQueue(env: Env): Promise<{ success: boolean; processed: number; error?: string }> {
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 25_000; // 25s — safe for both cron and HTTP
  const BATCH_SIZE = 100;
  const workerId = crypto.randomUUID();
  const processingList = `processing:${workerId}`;
  let totalProcessed = 0;

  const redis = getRedis(env);
  const db = getDb(env);

  console.log(`[Worker ${workerId}] Started`);

  try {
    while (Date.now() - startTime < MAX_RUNTIME_MS) {
      // ── Drain up to BATCH_SIZE items from queue ──────────────────────────
      const batch: any[] = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const raw = await redis.lmove('form_submissions_queue', processingList).catch(() => null);
        if (!raw) break;
        try {
          const item = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!item?.msg_id) {
            await pushDeadLetter(redis, { raw }, 'Missing msg_id');
            continue;
          }
          // Skip already-completed messages (idempotency)
          const status = await redis.hget(`msg:${item.msg_id}`, 'status').catch(() => null);
          if (status === 'completed') {
            console.log(`[Worker] Skip already-completed msg:${item.msg_id}`);
            continue;
          }
          batch.push(item);
        } catch {
          await pushDeadLetter(redis, { raw }, 'JSON parse error');
        }
      }

      if (!batch.length) {
        console.log(`[Worker ${workerId}] Queue empty, done.`);
        break;
      }

      console.log(`[Worker ${workerId}] Processing batch of ${batch.length}`);

      // ── Turnstile verification ───────────────────────────────────────────
      const verified: any[] = [];
      for (const item of batch) {
        await redis.hset(`msg:${item.msg_id}`, 'status', 'processing').catch(() => {});

        if (env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SECRET_KEY !== 'your_secret_key_here' && item.captchaToken) {
          try {
            const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${item.captchaToken}`,
            });
            const vData = await vRes.json() as any;
            if (!vData.success) {
              await pushDeadLetter(redis, item, `Turnstile rejected: ${JSON.stringify(vData['error-codes'] || [])}`);
              continue;
            }
          } catch (e: any) {
            console.warn('[Turnstile Error]', e.message, '— allowing submission');
          }
        }
        verified.push(item);
      }

      if (!verified.length) {
        await redis.del(processingList);
        continue;
      }

      // ── Insert submissions into Turso ────────────────────────────────────
      const insertedMap = new Map<string, string>(); // msg_id → submission_id

      for (const item of verified) {
        try {
          const subId = crypto.randomUUID();
          const dataJson = typeof item.data === 'string' ? item.data : JSON.stringify(item.data ?? {});
          const submittedAt = item.submitted_at || new Date().toISOString();

          await db.execute({
            sql: `INSERT INTO submissions (id, form_id, data, submitted_at)
                  VALUES (?, ?, ?, ?)`,
            args: [subId, item.form_id, dataJson, submittedAt],
          });

          // Insert file records
          if (Array.isArray(item.files) && item.files.length > 0) {
            for (const f of item.files) {
              await db.execute({
                sql: `INSERT INTO files (id, submission_id, file_path, file_name, file_size, mime_type)
                      VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                  crypto.randomUUID(),
                  subId,
                  f.path || f.url || '',
                  f.fileName || f.name || 'unknown',
                  f.size || 0,
                  f.mimeType || f.mime_type || 'application/octet-stream',
                ],
              }).catch((e: any) => console.error('[File Insert Error]', e.message));
            }
          }

          insertedMap.set(item.msg_id, subId);
        } catch (e: any) {
          console.error(`[DB Insert Error] msg:${item.msg_id}`, e.message);
          await pushDeadLetter(redis, item, `DB insert failed: ${e.message}`);
        }
      }

      // ── Load form configs (Redis-cached, fallback to Turso) ──────────────
      const uniqueFormIds = [...new Set(verified.map((i) => i.form_id as string))];
      const configMap = new Map<string, any>();

      for (const fid of uniqueFormIds) {
        try {
          const cached = await redis.get(`form:${fid}:meta`).catch(() => null);
          if (cached) {
            configMap.set(fid, typeof cached === 'string' ? JSON.parse(cached) : cached);
            continue;
          }
          const result = await db.execute({ sql: 'SELECT * FROM forms WHERE id = ?', args: [fid] });
          if (result.rows.length) {
            const conf = result.rows[0];
            configMap.set(fid, conf);
            await redis.setex(`form:${fid}:meta`, 60, JSON.stringify(conf)).catch(() => {});
          }
        } catch (e: any) {
          console.error(`[Config Load Error] form:${fid}`, e.message);
        }
      }

      // ── Run integrations + mark completed ────────────────────────────────
      await Promise.allSettled(
        verified.map(async (item) => {
          const subId = insertedMap.get(item.msg_id);
          if (!subId) return; // was dead-lettered above

          const formConfig = configMap.get(item.form_id);
          if (formConfig) {
            await runIntegrations(env, db, formConfig as Record<string, any>, subId, item.data ?? {}).catch(
              (e: any) => console.error('[Integration Error]', e.message)
            );
          }

          await redis.hset(`msg:${item.msg_id}`, 'status', 'completed').catch(() => {});
        })
      );

      totalProcessed += insertedMap.size;
      await redis.del(processingList).catch(() => {});
    }

    console.log(`[Worker ${workerId}] Done. Total processed: ${totalProcessed}`);
    return { success: true, processed: totalProcessed };
  } catch (err: any) {
    console.error(`[Worker ${workerId}] Fatal error:`, err.message);
    await redis.del(processingList).catch(() => {});
    return { success: false, processed: totalProcessed, error: err.message };
  }
}
