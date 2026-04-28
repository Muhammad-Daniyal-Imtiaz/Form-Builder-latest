import { createClient } from "supabase";
import nodemailer from "nodemailer";
import crypto, { createHash, createDecipheriv, pbkdf2Sync } from "node:crypto";
import { Buffer } from "node:buffer";

// --- Types ---
interface FileRecord {
  path: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

// --- Encryption Utility ---
const ENCRYPTION_SECRET = Deno.env.get("ENCRYPTION_SECRET") || "";
const ENCRYPTION_PREFIX = "enc:v2";

function deriveCurrentKey(secret: string) {
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  return createHash("sha256").update(secret, "utf8").digest();
}

function deriveLegacyKey(secret: string) {
  return pbkdf2Sync(secret, "salt", 100, 32, "sha1");
}

function decryptCurrent(text: string, secret: string) {
  const [, , ivPart, encryptedPart, tagPart] = text.split(":");
  if (!ivPart || !encryptedPart || !tagPart) return text;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      deriveCurrentKey(secret),
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return text;
  }
}

function decryptLegacy(text: string, secret: string): string {
  const parts = text.split(":");
  const ivHex = parts.shift();
  const encryptedText = parts.join(":");
  if (!ivHex || ivHex.length !== 32 || !encryptedText) return text;

  try {
    const decipher = createDecipheriv(
      "aes-256-cbc",
      deriveLegacyKey(secret),
      Buffer.from(ivHex, "hex"),
    );
    const decrypted = Buffer.concat([
      decipher.update(encryptedText, "base64"),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return text;
  }
}

function decrypt(text: string): string {
  if (!text) return "";
  if (!ENCRYPTION_SECRET) return text;
  if (text.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    return decryptCurrent(text, ENCRYPTION_SECRET);
  }
  if (text.includes(":")) {
    return decryptLegacy(text, ENCRYPTION_SECRET);
  }
  return text;
}

// --- Worker Setup ---
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const startTime = Date.now();
  const workerId = crypto.randomUUID(); // Unique ID for this execution
  console.log(`[Worker] Triggered by: ${body.trigger || 'unknown'} (ID: ${workerId})`);

  let totalProcessed = 0;

  try {
    const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");

    if (!redisUrl || !redisToken) throw new Error("Missing Upstash Redis credentials");

    const authHeader = { Authorization: `Bearer ${redisToken}` };
    const processingList = `processing:${workerId}`;

    // 🚀 DRAIN LOOP with Crash Safety
    while (Date.now() - startTime < 120000) {
      const batch: any[] = [];
      
      for (let i = 0; i < 500; i++) {
        const moveRes = await fetch(`${redisUrl}/lmove/form_submissions_queue/${processingList}/RIGHT/LEFT`, {
           method: 'POST',
           headers: authHeader
        });
        const moveData = await moveRes.json();
        if (moveData.result) {
          batch.push(typeof moveData.result === 'string' ? JSON.parse(moveData.result) : moveData.result);
        } else {
          break; // Queue empty
        }
      }

      if (batch.length === 0) break;
      console.log(`[Worker] Safely moved ${batch.length} items to ${processingList}`);

      // Step A: Parallel Verification & Status Updates
      const verifiedItems = await Promise.all(batch.map(async (item) => {
        const msgKey = `msg:${item.msg_id}`;
        await fetch(`${redisUrl}/hset/${msgKey}/status/processing`, { headers: authHeader });

        if (turnstileSecret && turnstileSecret !== 'your_secret_key_here' && item.captchaToken) {
          try {
            const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `secret=${turnstileSecret}&response=${item.captchaToken}`,
            });
            const vData = await vRes.json();
            if (!vData.success) {
              await fetch(`${redisUrl}/hset/${msgKey}/status/rejected`, { headers: authHeader });
              return null;
            }
          } catch (e) { console.error(`[Worker] Turnstile error:`, e); }
        }
        return item;
      }));

      const validItems = verifiedItems.filter(i => i !== null);
      
      if (validItems.length > 0) {
        // STAGE 1: Bulk Insert Submissions
        const submissionsToInsert = validItems.map(item => ({
          form_id: item.form_id,
          data: item.data,
          submitted_at: item.submitted_at || new Date().toISOString()
        }));

        const { data: insertedSubmissions, error: bulkSubmitError } = await supabase
          .from("submissions")
          .insert(submissionsToInsert)
          .select('id, form_id, data, submitted_at');

        if (bulkSubmitError) throw bulkSubmitError;

        // STAGE 2: Bulk Insert Files
        const fileRecords: any[] = [];
        insertedSubmissions.forEach((sub, index) => {
          const originalFiles = validItems[index].files;
          if (originalFiles?.length > 0) {
            originalFiles.forEach((f: any) => {
              fileRecords.push({
                submission_id: sub.id,
                file_path: f.path,
                file_name: f.fileName || "unknown",
                file_size: f.size || 0,
                mime_type: f.mimeType || f.mime_type || "application/octet-stream",
              });
            });
          }
        });
        if (fileRecords.length > 0) await supabase.from("files").insert(fileRecords);

        // STAGE 3: Integrations & Completion (DB-Independence Optimization)
        const uniqueFormIds = [...new Set(validItems.map(i => i.form_id))];
        const configMap = new Map();

        // 🚀 Attempt Redis lookup for all form configs in the batch
        const redisMgetRes = await fetch(`${redisUrl}/mget/${uniqueFormIds.map(id => `form:${id}:meta`).join('/')}`, { headers: authHeader });
        const redisMgetData = await redisMgetRes.json();
        const cachedConfigs = redisMgetData.result || [];

        const missingFormIds: string[] = [];
        uniqueFormIds.forEach((id, idx) => {
          const cached = cachedConfigs[idx];
          if (cached) {
            configMap.set(id, typeof cached === 'string' ? JSON.parse(cached) : cached);
          } else {
            missingFormIds.push(id);
          }
        });

        // 🚀 Hit DB only for missing configs
        if (missingFormIds.length > 0) {
          const { data: dbConfigs } = await supabase.from("forms").select("*").in("id", missingFormIds);
          if (dbConfigs) {
            for (const conf of dbConfigs) {
              configMap.set(conf.id, conf);
              // Backfill Redis cache (60s)
              await fetch(`${redisUrl}/setex/form:${conf.id}:meta/60/${encodeURIComponent(JSON.stringify(conf))}`, { headers: authHeader });
            }
          }
        }

        await Promise.allSettled(insertedSubmissions.map(async (sub, idx) => {
          const formConfig = configMap.get(sub.form_id);
          const originalItem = validItems[idx];
          if (formConfig) await runIntegrations(formConfig, sub, sub.data);
          await fetch(`${redisUrl}/hset/msg:${originalItem.msg_id}/status/completed`, { headers: authHeader });
        }));

        totalProcessed += validItems.length;
      }

      await fetch(`${redisUrl}/del/${processingList}`, { headers: authHeader });
    }

    return new Response(JSON.stringify({ success: true, processed: totalProcessed }));

  } catch (err) {
    console.error("[Worker] Global Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

async function runIntegrations(formConfig: any, submission: any, data: any) {
  const tasks = [];

  // SLACK
  if (formConfig.slack_enabled && formConfig.slack_bot_token && formConfig.slack_channel_id) {
    tasks.push((async () => {
      try {
        const token = decrypt(formConfig.slack_bot_token);
        const { data: flds } = await supabase.from('form_fields').select('id, label').eq('form_id', formConfig.id);
        const blocks = [
          { type: "header", text: { type: "plain_text", text: "New Submission (Buffered)" } },
          { type: "section", text: { type: "mrkdwn", text: `*Form:* ${formConfig.title}\n*ID:* ${submission.id}` } }
        ];
        flds?.forEach(f => {
          const val = Array.isArray(data[f.id]) ? data[f.id].map((v:any)=>v.url||v).join(', ') : data[f.id];
          blocks.push({ type: "section", text: { type: "mrkdwn", text: `*${f.label}:* ${val || '-(empty)-'}` } });
        });
        const res = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: formConfig.slack_channel_id, blocks })
        });
        if (res.ok) await supabase.from('submissions').update({ slack_synced: true }).eq('id', submission.id);
      } catch (e) { console.error("[Slack Error]", e); }
    })());
  }

  // ZAPIER
  if (formConfig.zapier_enabled && formConfig.zapier_webhook_url) {
    tasks.push((async () => {
      try {
        const url = decrypt(formConfig.zapier_webhook_url);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submission.id, ...data })
        });
        if (res.ok) await supabase.from('submissions').update({ zapier_synced: true }).eq('id', submission.id);
      } catch (e) { console.error("[Zapier Error]", e); }
    })());
  }

  // AIRTABLE
  if (formConfig.airtable_enabled && formConfig.airtable_api_key && formConfig.airtable_base_id) {
    tasks.push((async () => {
      try {
        const key = decrypt(formConfig.airtable_api_key);
        const res = await fetch(`https://api.airtable.com/v0/${formConfig.airtable_base_id}/${encodeURIComponent(formConfig.airtable_table_name || 'Submissions')}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: [{ fields: { ...data, "Submission Date": submission.submitted_at } }] })
        });
        if (res.ok) await supabase.from('submissions').update({ airtable_synced: true }).eq('id', submission.id);
      } catch (e) { console.error("[Airtable Error]", e); }
    })());
  }

  // EMAIL
  if (formConfig.email_enabled && formConfig.notification_email && formConfig.email_app_password) {
    tasks.push((async () => {
      try {
        const pass = decrypt(formConfig.email_app_password);
        const transporter = nodemailer.createTransport({
          host: formConfig.email_host || 'smtp.gmail.com',
          port: formConfig.email_port || 465,
          secure: formConfig.email_secure ?? true,
          auth: { user: formConfig.notification_email, pass },
        });
        await transporter.sendMail({
          from: `"Form Worker" <${formConfig.notification_email}>`,
          to: formConfig.email_to_list || formConfig.notification_email,
          subject: `🛎️ New Async Submission: ${formConfig.title}`,
          html: `<p>New submission received for ${formConfig.title}.</p><pre>${JSON.stringify(data, null, 2)}</pre>`
        });
      } catch (e) { console.error("[Email Error]", e); }
    })());
  }

  // GOOGLE SHEETS
  if (formConfig.google_sheet_enabled && formConfig.google_sheet_id) {
    tasks.push((async () => {
        try {
            const accessToken = await getGoogleAccessToken(formConfig.user_id);
            if (accessToken) {
                const sheetName = formConfig.google_sheet_name || 'Sheet1';
                const row = [new Date().toLocaleString(), ...Object.values(data)];
                const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${formConfig.google_sheet_id}/values/${sheetName}:append?valueInputOption=USER_ENTERED`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: [row] })
                });
                if (res.ok) await supabase.from('submissions').update({ google_synced: true }).eq('id', submission.id);
            }
        } catch (e) { console.error("[Google Sheets Error]", e); }
    })());
  }

  await Promise.allSettled(tasks);
}

async function getGoogleAccessToken(userId: string) {
    const { data: integration } = await supabase.from('user_integrations').select('*').eq('user_id', userId).eq('provider', 'google').single();
    if (!integration) return null;
    const isExpired = !integration.expires_at || new Date(integration.expires_at).getTime() < Date.now() + 5 * 60 * 1000;
    if (!isExpired) return integration.access_token;
    
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret || !integration.refresh_token) return null;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
        }),
    });
    const d = await res.json();
    if (!res.ok) return null;
    await supabase.from('user_integrations').update({
        access_token: d.access_token,
        expires_at: new Date(Date.now() + d.expires_in * 1000).toISOString(),
    }).eq('id', integration.id);
    return d.access_token;
}
