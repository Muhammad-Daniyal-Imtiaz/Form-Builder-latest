/**
 * Form Builder — Submission Processor (Cloudflare Worker)
 * Drains Redis queue → inserts into Turso → fires integrations
 * Cron: every 2 minutes
 * NO npm imports — uses Turso HTTP API + Upstash REST API directly
 */

// ── Turso HTTP Client (no npm needed) ─────────────────────────────────────────
function getDb(env) {
  const rawUrl = env.TURSO_DATABASE_URL || '';
  const baseUrl = rawUrl.replace(/^libsql:\/\//, 'https://');
  const token = env.TURSO_AUTH_TOKEN;

  async function execute(sqlOrObj, argsParams = []) {
    let sql = typeof sqlOrObj === 'string' ? sqlOrObj : sqlOrObj.sql;
    let args = typeof sqlOrObj === 'object' && sqlOrObj.args ? sqlOrObj.args : argsParams;

    const body = {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: args.map(a => {
              if (a === null || a === undefined) return { type: 'null' };
              if (typeof a === 'number') return { type: Number.isInteger(a) ? 'integer' : 'float', value: String(a) };
              return { type: 'text', value: String(a) };
            }),
          },
        },
        { type: 'close' },
      ],
    };

    const res = await fetch(`${baseUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Turso HTTP error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const result = data.results?.[0];
    if (result?.type === 'error') throw new Error(`Turso query error: ${result.error?.message}`);

    // Convert Turso response format to rows array
    const cols = result?.response?.result?.cols?.map(c => c.name) ?? [];
    const rows = (result?.response?.result?.rows ?? []).map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]?.value ?? null; });
      return obj;
    });

    return { rows };
  }

  return { execute };
}

// ── Redis Client (Upstash REST API) ───────────────────────────────────────────
function getRedis(env) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function rjson(res) {
    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown');
      throw new Error(`Redis HTTP ${res.status}: ${text}`);
    }
    return res.json();
  }

  return {
    async lmove(src, dst, from = 'RIGHT', to = 'LEFT') {
      const res = await fetch(`${url}/lmove/${encodeURIComponent(src)}/${encodeURIComponent(dst)}/${from}/${to}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return null;
      const data = await rjson(res).catch(() => ({ result: null }));
      return data.result;
    },
    async rpoplpush(src, dst) {
      // Alternative: atomically pop from RIGHT of src and push to LEFT of dst
      const res = await fetch(`${url}/rpoplpush/${encodeURIComponent(src)}/${encodeURIComponent(dst)}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return null;
      const data = await rjson(res).catch(() => ({ result: null }));
      return data.result;
    },
    async lpush(key, value) {
      const res = await fetch(`${url}/lpush/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify([value]),
      });
      await res.text();
    },
    async rpush(key, value) {
      const res = await fetch(`${url}/rpush/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify([value]),
      });
      await res.text();
    },
    async hset(key, field, value) {
      const res = await fetch(`${url}/hset/${encodeURIComponent(key)}/${encodeURIComponent(field)}/${encodeURIComponent(value)}`, {
        method: 'POST',
        headers,
      });
      await res.text();
    },
    async hmset(key, obj) {
      // Set multiple hash fields at once
      const entries = Object.entries(obj);
      if (entries.length === 0) return;
      const parts = entries.map(([f, v]) => `${encodeURIComponent(f)}/${encodeURIComponent(String(v))}`).join('/');
      const res = await fetch(`${url}/hmset/${encodeURIComponent(key)}/${parts}`, {
        method: 'POST',
        headers,
      });
      await res.text();
    },
    async hget(key, field) {
      const res = await fetch(`${url}/hget/${encodeURIComponent(key)}/${encodeURIComponent(field)}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return null;
      const data = await rjson(res).catch(() => ({ result: null }));
      return data.result;
    },
    async hgetall(key) {
      const res = await fetch(`${url}/hgetall/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return null;
      const data = await rjson(res).catch(() => ({ result: [] }));
      // hgetall returns array of [field, value, field, value, ...]
      const arr = data.result || [];
      const obj = {};
      for (let i = 0; i < arr.length; i += 2) {
        obj[arr[i]] = arr[i + 1];
      }
      return obj;
    },
    async get(key) {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return null;
      const data = await rjson(res).catch(() => ({ result: null }));
      return data.result;
    },
    async setex(key, ttl, value) {
      const res = await fetch(`${url}/setex/${encodeURIComponent(key)}/${ttl}/${encodeURIComponent(value)}`, {
        method: 'POST',
        headers,
      });
      await res.text();
    },
    async del(key) {
      const res = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
      });
      await res.text();
    },
    async llen(key) {
      const res = await fetch(`${url}/llen/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return 0;
      const data = await rjson(res).catch(() => ({ result: 0 }));
      return data.result || 0;
    },
    async lrange(key, start, stop) {
      const res = await fetch(`${url}/lrange/${encodeURIComponent(key)}/${start}/${stop}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return [];
      const data = await rjson(res).catch(() => ({ result: [] }));
      return data.result || [];
    },
    async lrem(key, count, value) {
      const res = await fetch(`${url}/lrem/${encodeURIComponent(key)}/${count}/${encodeURIComponent(value)}`, {
        method: 'POST',
        headers,
      });
      await res.text();
    },
  };
}

// ── Encryption ────────────────────────────────────────────────────────────────
async function decryptWeb(payload, secret) {
  try {
    const parts = payload.split(':');
    if (parts.length < 3) return payload;
    const [, ivPart, encryptedPart] = parts;
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret));
    const key = await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['decrypt']);
    const fromBase64Url = (s) => {
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

async function decryptValue(text, secret) {
  if (!text || !secret) return text ?? '';
  if (text.startsWith('enc:v3:')) return decryptWeb(text, secret);
  return text;
}

// ── Form Config Normalizer ────────────────────────────────────────────────────
// Maps raw Turso DB row (snake_case columns) to the format expected by runIntegrations
function normalizeFormConfig(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? null,
    user_id: raw.user_id ?? raw.userId ?? null,
    title: raw.title ?? 'Untitled Form',
    description: raw.description ?? '',
    published: raw.published ?? false,
    // Google Sheets
    google_sheet_id: raw.google_sheet_id ?? null,
    google_sheet_name: raw.google_sheet_name ?? 'Sheet1',
    google_sheet_enabled: raw.google_sheet_enabled === 1 || raw.google_sheet_enabled === true,
    // Zapier
    zapier_webhook_url: raw.zapier_webhook_url ?? null,
    zapier_enabled: raw.zapier_enabled === 1 || raw.zapier_enabled === true,
    // Airtable
    airtable_api_key: raw.airtable_api_key ?? null,
    airtable_base_id: raw.airtable_base_id ?? null,
    airtable_table_name: raw.airtable_table_name ?? 'Submissions',
    airtable_enabled: raw.airtable_enabled === 1 || raw.airtable_enabled === true,
    // Slack
    slack_bot_token: raw.slack_bot_token ?? null,
    slack_channel_id: raw.slack_channel_id ?? null,
    slack_channel_name: raw.slack_channel_name ?? null,
    slack_enabled: raw.slack_enabled === 1 || raw.slack_enabled === true,
    // Email
    email_enabled: raw.email_enabled === 1 || raw.email_enabled === true,
    notification_email: raw.notification_email ?? null,
    email_app_password: raw.email_app_password ?? null,
    email_to_list: raw.email_to_list ?? null,
    email_host: raw.email_host ?? 'smtp.gmail.com',
    email_port: raw.email_port ?? 465,
    email_secure: raw.email_secure === 1 || raw.email_secure === true,
    // Notion
    notion_api_key: raw.notion_api_key ?? null,
    notion_database_id: raw.notion_database_id ?? null,
    notion_enabled: raw.notion_enabled === 1 || raw.notion_enabled === true,
    // Cache timestamp
    _cached_at: Date.now(),
  };
}

// ── Dead Letter Queue ─────────────────────────────────────────────────────────
const DEAD_LETTER_QUEUE = 'form_submissions_dead_letter';

async function pushDeadLetter(redis, item, error) {
  const payload = {
    ...item,
    error: String(error),
    failed_at: Date.now(),
    retry_count: (item?.retry_count || 0) + 1,
  };
  await redis.lpush(DEAD_LETTER_QUEUE, JSON.stringify(payload)).catch(() => { });
  if (item?.msg_id) {
    await redis.hset(`msg:${item.msg_id}`, 'status', 'failed').catch(() => { });
  }
}

// ── Integrations ──────────────────────────────────────────────────────────────
async function runIntegrations(env, db, formConfig, submissionId, data) {
  const tasks = [];
  const secret = env.ENCRYPTION_SECRET;

  // SLACK
  if (formConfig.slack_enabled && formConfig.slack_bot_token && formConfig.slack_channel_id) {
    tasks.push((async () => {
      try {
        const token = await decryptValue(formConfig.slack_bot_token, secret);
        const fieldsResult = await db.execute(
          'SELECT id, label FROM form_fields WHERE form_id = ?',
          [formConfig.id]
        );
        const blocks = [
          { type: 'header', text: { type: 'plain_text', text: '\ud83d\udd14 New Form Submission' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*Form:* ${formConfig.title}\n*ID:* ${submissionId}` } },
        ];
        for (const row of fieldsResult.rows) {
          const val = data[row.id] || data[row.label] || '';
          const display = Array.isArray(val) ? val.map(v => v.url || v).join(', ') : String(val || '-(empty)-');
          blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${row.label}:* ${display}` } });
        }
        const res = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: formConfig.slack_channel_id, blocks }),
        });
        if (res.ok) {
          await db.execute('UPDATE submissions SET slack_synced = 1 WHERE id = ?', [submissionId]);
        }
      } catch (e) { console.error('[Slack Error]', e.message); }
    })());
  }

  // ZAPIER
  if (formConfig.zapier_enabled && formConfig.zapier_webhook_url) {
    tasks.push((async () => {
      try {
        const webhookUrl = await decryptValue(formConfig.zapier_webhook_url, secret);
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submissionId, ...data }),
        });
        if (res.ok) {
          await db.execute('UPDATE submissions SET zapier_synced = 1 WHERE id = ?', [submissionId]);
        }
      } catch (e) { console.error('[Zapier Error]', e.message); }
    })());
  }

  // AIRTABLE
  if (formConfig.airtable_enabled && formConfig.airtable_api_key && formConfig.airtable_base_id) {
    tasks.push((async () => {
      try {
        const key = await decryptValue(formConfig.airtable_api_key, secret);
        const res = await fetch(
          `https://api.airtable.com/v0/${formConfig.airtable_base_id}/${encodeURIComponent(formConfig.airtable_table_name || 'Submissions')}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: [{ fields: { ...data, 'Submission Date': new Date().toISOString() } }]
            }),
          }
        );
        if (res.ok) {
          await db.execute('UPDATE submissions SET airtable_synced = 1 WHERE id = ?', [submissionId]);
        }
      } catch (e) { console.error('[Airtable Error]', e.message); }
    })());
  }

  // GOOGLE SHEETS
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
            await db.execute('UPDATE submissions SET google_synced = 1 WHERE id = ?', [submissionId]);
          }
        }
      } catch (e) { console.error('[Google Sheets Error]', e.message); }
    })());
  }

  // NOTION
  if (formConfig.notion_enabled && formConfig.notion_api_key && formConfig.notion_database_id) {
    tasks.push((async () => {
      try {
        const notionKey = await decryptValue(formConfig.notion_api_key, secret);
        const properties = {
          'Submission ID': { rich_text: [{ text: { content: String(submissionId) } }] },
          'Date': { date: { start: new Date().toISOString() } },
        };
        for (const [k, v] of Object.entries(data)) {
          const strVal = Array.isArray(v) ? v.join(', ') : String(v ?? '');
          properties[k] = { rich_text: [{ text: { content: strVal.substring(0, 2000) } }] };
        }
        await fetch('https://api.notion.com/v1/pages', {
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
      } catch (e) { console.error('[Notion Error]', e.message); }
    })());
  }

  await Promise.allSettled(tasks);
}

// ── Google Token Refresh ──────────────────────────────────────────────────────
async function getGoogleAccessToken(env, db, userId) {
  try {
    const result = await db.execute(
      "SELECT * FROM user_integrations WHERE user_id = ? AND provider = 'google' LIMIT 1",
      [userId]
    );
    if (!result.rows.length) return null;
    const integration = result.rows[0];
    const isExpired = !integration.expires_at || new Date(integration.expires_at).getTime() < Date.now() + 5 * 60 * 1000;
    if (!isExpired) return integration.access_token;
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !integration.refresh_token) return null;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const d = await res.json();
    if (!res.ok) return null;

    await db.execute(
      'UPDATE user_integrations SET access_token = ?, expires_at = ? WHERE id = ?',
      [d.access_token, new Date(Date.now() + d.expires_in * 1000).toISOString(), integration.id]
    );
    return d.access_token;
  } catch (e) {
    console.error('[Google Token Error]', e.message);
    return null;
  }
}

// ── Deduplication: Check if msg_id already exists in Turso ───────────────────
async function isAlreadyProcessed(db, msgId) {
  try {
    // Check the msg status hash in Redis first (fastest)
    // But also check Turso as source of truth
    const result = await db.execute(
      'SELECT id FROM submissions WHERE id = (SELECT submission_id FROM submission_tracking WHERE msg_id = ? LIMIT 1)',
      [msgId]
    );
    return result.rows.length > 0;
  } catch {
    // If the tracking table doesn't exist yet, fall back to checking by msg_id in data
    // Since we can't query JSON inside data easily, return false and rely on Redis check
    return false;
  }
}

// ── Core Queue Processor ──────────────────────────────────────────────────────

/**
 * Safely move all items from a processing list back to the main queue.
 * Uses RPOP + LPUSH to preserve FIFO ordering.
 */
async function requeueProcessingList(redis, processingList) {
  let requeued = 0;
  while (true) {
    // Use rpoplpush: pop from RIGHT of processingList, push to LEFT of main queue
    // This preserves order: oldest items go back first
    try {
      const raw = await redis.rpoplpush(processingList, 'form_submissions_queue');
      if (!raw) break;
      requeued++;
    } catch {
      break;
    }
  }
  console.log(`[Requeue] Moved ${requeued} items from ${processingList} back to queue`);
  // Clean up the processing list
  await redis.del(processingList).catch(() => { });
}

/**
 * Main processing loop. Drains the Redis queue, inserts into Turso, runs integrations.
 */
async function processQueue(env) {
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 25000; // 25s safe limit for cron jobs
  const BATCH_SIZE = 50;
  const workerId = crypto.randomUUID();
  const processingList = `processing:${workerId}`;
  let totalProcessed = 0;
  let totalSkipped = 0;

  // Validate required env vars
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    console.error('[Worker] Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    return { success: false, error: 'Missing Turso credentials', processed: 0 };
  }
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('[Worker] Missing Upstash Redis credentials');
    return { success: false, error: 'Missing Redis credentials', processed: 0 };
  }

  const redis = getRedis(env);
  const db = getDb(env);

  console.log(`[Worker ${workerId}] Started`);

  try {
    // Quick health check on Turso
    try {
      await db.execute('SELECT 1');
    } catch (e) {
      console.error(`[Worker ${workerId}] Turso connection failed:`, e.message);
      return { success: false, error: `Turso connection failed: ${e.message}`, processed: 0 };
    }

    while (Date.now() - startTime < MAX_RUNTIME_MS) {
      const batch = [];

      // ── 1. Pull items from queue into processing list ──────────────────────
      for (let i = 0; i < BATCH_SIZE; i++) {
        try {
          // Use lmove: move from RIGHT of queue (oldest) to LEFT of processing list
          const raw = await redis.lmove('form_submissions_queue', processingList, 'RIGHT', 'LEFT');
          if (!raw) break;

          let item;
          try {
            item = typeof raw === 'string' ? JSON.parse(raw) : raw;
          } catch {
            console.warn(`[Worker ${workerId}] JSON parse error for raw item`);
            await pushDeadLetter(redis, { raw, _parse_error: true }, 'JSON parse error');
            continue;
          }

          if (!item?.msg_id) {
            await pushDeadLetter(redis, item, 'Missing msg_id');
            continue;
          }

          // Skip if already completed in Redis (fast path)
          try {
            const status = await redis.hget(`msg:${item.msg_id}`, 'status');
            if (status === 'completed') {
              console.log(`[Worker] Skip completed msg:${item.msg_id}`);
              totalSkipped++;
              continue;
            }
          } catch {
            // If Redis hash check fails, continue processing (will dedup via DB)
          }

          // Skip if already in Turso DB (source of truth)
          const alreadyInDb = await isAlreadyProcessed(db, item.msg_id);
          if (alreadyInDb) {
            console.log(`[Worker] Skip already-in-DB msg:${item.msg_id}`);
            // Mark as completed in Redis to avoid future checks
            await redis.hset(`msg:${item.msg_id}`, 'status', 'completed').catch(() => { });
            totalSkipped++;
            continue;
          }

          batch.push(item);
        } catch (e) {
          console.warn(`[Worker ${workerId}] Error pulling item:`, e.message);
          break;
        }
      }

      if (!batch.length) {
        console.log(`[Worker ${workerId}] Queue empty or all skipped. Processed: ${totalProcessed}, Skipped: ${totalSkipped}`);
        await redis.del(processingList).catch(() => { });
        break;
      }

      console.log(`[Worker ${workerId}] Processing ${batch.length} items (total processed so far: ${totalProcessed})`);

      // ── 2. Mark as processing in Redis ────────────────────────────────────
      await Promise.all(batch.map(item =>
        redis.hset(`msg:${item.msg_id}`, 'status', 'processing').catch(() => { })
      ));

      // ── 3. Turnstile verification ─────────────────────────────────────────
      const verified = [];
      for (const item of batch) {
        if (env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SECRET_KEY !== 'your_secret_key_here') {
          if (item.captchaToken) {
            try {
              const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${item.captchaToken}`,
              });
              const vData = await vRes.json();
              if (!vData.success) {
                await pushDeadLetter(redis, item, `Turnstile rejected: ${JSON.stringify(vData['error-codes'] || [])}`);
                continue;
              }
            } catch (e) {
              console.warn('[Turnstile Error]', e.message);
              // Allow on network error — don't block submission due to Turnstile verification failure
            }
          }
          // If captchaToken is missing but Turnstile is configured, still process it
          // (the frontend should always send it; if not, it's a bug there)
        }
        verified.push(item);
      }

      if (!verified.length) {
        console.log(`[Worker ${workerId}] All ${batch.length} items failed Turnstile`);
        await redis.del(processingList).catch(() => { });
        continue;
      }

      // ── 4. Insert submissions into Turso ──────────────────────────────────
      const insertedMap = new Map(); // msg_id -> submission_id

      for (const item of verified) {
        try {
          const subId = crypto.randomUUID();
          const dataJson = typeof item.data === 'string' ? item.data : JSON.stringify(item.data ?? {});
          const submittedAt = item.submitted_at || new Date().toISOString();

          await db.execute(
            'INSERT INTO submissions (id, form_id, data, submitted_at) VALUES (?, ?, ?, ?)',
            [subId, item.form_id, dataJson, submittedAt]
          );

          // Insert files if any
          if (Array.isArray(item.files) && item.files.length > 0) {
            for (const f of item.files) {
              try {
                await db.execute(
                  'INSERT INTO files (id, submission_id, file_path, file_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
                  [
                    crypto.randomUUID(),
                    subId,
                    f.path || f.url || '',
                    f.fileName || f.name || 'unknown',
                    f.size || 0,
                    f.mimeType || f.mime_type || 'application/octet-stream',
                  ]
                );
              } catch (e) {
                console.error('[File Insert Error]', e.message);
                // Don't fail the whole submission if file insert fails
              }
            }
          }

          insertedMap.set(item.msg_id, subId);
          console.log(`[Worker ${workerId}] Inserted submission ${subId} for msg:${item.msg_id}`);
        } catch (e) {
          console.error(`[DB Insert Error] msg:${item.msg_id}`, e.message);

          // Check if this is a duplicate key error — if so, treat as success
          if (e.message?.includes('UNIQUE') || e.message?.includes('unique') || e.message?.includes('constraint')) {
            console.warn(`[DB Insert Error] msg:${item.msg_id} appears to be a duplicate, marking as completed`);
            await redis.hset(`msg:${item.msg_id}`, 'status', 'completed').catch(() => { });
            continue;
          }

          await pushDeadLetter(redis, item, `DB insert failed: ${e.message}`);
        }
      }

      if (insertedMap.size === 0) {
        console.log(`[Worker ${workerId}] No items were inserted, skipping integrations`);
        await redis.del(processingList).catch(() => { });
        continue;
      }

      // ── 5. Load form configs ──────────────────────────────────────────────
      const uniqueFormIds = [...new Set(verified.map(i => i.form_id))];
      const configMap = new Map();

      for (const fid of uniqueFormIds) {
        try {
          // Try Redis cache first
          const cached = await redis.get(`form:${fid}:meta`).catch(() => null);
          if (cached) {
            try {
              const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
              const normalized = normalizeFormConfig(parsed);
              if (normalized) {
                configMap.set(fid, normalized);
                continue;
              }
            } catch {
              // Cache parse failed, fall through to DB
            }
          }

          // Fetch from Turso
          const result = await db.execute('SELECT * FROM forms WHERE id = ?', [fid]);
          if (result.rows.length) {
            const normalized = normalizeFormConfig(result.rows[0]);
            if (normalized) {
              configMap.set(fid, normalized);
              // Cache for 60 seconds
              await redis.setex(`form:${fid}:meta`, 60, JSON.stringify(result.rows[0])).catch(() => { });
            }
          }
        } catch (e) {
          console.error(`[Config Load Error] form:${fid}`, e.message);
        }
      }

      // ── 6. Run integrations + mark complete ───────────────────────────────
      await Promise.allSettled(verified.map(async (item) => {
        const subId = insertedMap.get(item.msg_id);
        if (!subId) return;

        const formConfig = configMap.get(item.form_id);
        if (formConfig) {
          try {
            await runIntegrations(env, db, formConfig, subId, item.data ?? {});
          } catch (e) {
            console.error('[Integration Error]', e.message);
          }
        }

        // Mark as completed in Redis (idempotency)
        await redis.hset(`msg:${item.msg_id}`, 'status', 'completed').catch(() => { });
      }));

      totalProcessed += insertedMap.size;
      console.log(`[Worker ${workerId}] Batch done. Inserted: ${insertedMap.size}, Total: ${totalProcessed}`);

      // Clean up processing list
      await redis.del(processingList).catch(() => { });
    }

    console.log(`[Worker ${workerId}] Done. Processed: ${totalProcessed}, Skipped: ${totalSkipped}`);
    return { success: true, processed: totalProcessed, skipped: totalSkipped };
  } catch (err) {
    console.error(`[Worker ${workerId}] Fatal error:`, err.message);
    // Requeue any remaining items so they're not lost
    try {
      await requeueProcessingList(redis, processingList);
    } catch (e) {
      console.error(`[Worker ${workerId}] Failed to requeue:`, e.message);
    }
    return { success: false, processed: totalProcessed, error: err.message };
  }
}

// ── Worker Export ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // Optional auth check for manual triggers
    if (env.PROCESSOR_SECRET) {
      const auth = request.headers.get('authorization');
      if (auth !== `Bearer ${env.PROCESSOR_SECRET}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    const result = await processQueue(env);
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(processQueue(env));
  },
};