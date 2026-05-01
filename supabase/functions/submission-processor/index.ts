import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import nodemailer from "https://esm.sh/nodemailer@6.9.13";
import { createHash, createDecipheriv, pbkdf2Sync } from "node:crypto";
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
const NEW_ENCRYPTION_PREFIX = "enc:v3";

async function decryptWeb(payload: string, secret: string) {
  try {
    const parts = payload.split(':');
    if (parts.length < 3) return payload;
    
    const [, ivPart, encryptedPart] = parts;
    
    // Import Key
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret));
    const key = await crypto.subtle.importKey(
      'raw', hash, { name: 'AES-GCM' }, false, ['decrypt']
    );

    // Helper to convert base64url to Uint8Array
    const fromBase64Url = (base64url: string) => {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(base64);
      const buffer = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);
      return buffer;
    };

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(ivPart) },
      key,
      fromBase64Url(encryptedPart)
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("[Decrypt Error] Web Crypto:", err.message);
    return payload;
  }
}

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
  const parts = text.split(":");
  if (parts.length < 5) return text;
  
  const ivPart = parts[2];
  const encryptedPart = parts[3];
  const tagPart = parts[4];
  
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
  } catch (err) {
    console.error("[Decrypt Error] Current:", err.message);
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
  } catch (err) {
    console.error("[Decrypt Error] Legacy:", err.message);
    return text;
  }
}

async function decrypt(text: string): Promise<string> {
  if (!text) return "";
  if (!ENCRYPTION_SECRET) return text;
  if (text.startsWith(`${NEW_ENCRYPTION_PREFIX}:`)) {
    return await decryptWeb(text, ENCRYPTION_SECRET);
  }
  if (text.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    return decryptCurrent(text, ENCRYPTION_SECRET);
  }
  if (text.includes(":")) {
    return decryptLegacy(text, ENCRYPTION_SECRET);
  }
  return text;
}


// --- Supabase Setup ---
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const startTime = Date.now();
  const workerId = crypto.randomUUID();
  console.log(`[Worker] Started ID: ${workerId}, Trigger: ${body.trigger || 'manual'}`);

  let totalProcessed = 0;

  try {
    const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");

    if (!redisUrl || !redisToken) throw new Error("Missing Upstash Redis credentials");

    const authHeader = { Authorization: `Bearer ${redisToken}` };
    const processingList = `processing:${workerId}`;

    // 🚀 DRAIN LOOP
    while (Date.now() - startTime < 110000) {
      const batch: any[] = [];
      
      // Move up to 50 items per inner batch for better performance/reliability
      for (let i = 0; i < 50; i++) {
        const moveRes = await fetch(`${redisUrl}/lmove/form_submissions_queue/${encodeURIComponent(processingList)}/RIGHT/LEFT`, {
           method: 'POST',
           headers: authHeader
        });
        const moveData = await moveRes.json();
        if (moveData.result) {
          try {
            const item = typeof moveData.result === 'string' ? JSON.parse(moveData.result) : moveData.result;
            if (item && item.msg_id) {
                batch.push(item);
            }
          } catch (e) {
            console.error("[Worker] Failed to parse item:", moveData.result);
          }
        } else {
          break; // Queue empty
        }
      }

      if (batch.length === 0) break;
      console.log(`[Worker] Processing batch of ${batch.length} items`);

      // Parallel Verification
      const verifiedItems = await Promise.all(batch.map(async (item) => {
        const msgKey = `msg:${item.msg_id}`;
        
        // Mark as processing in Redis
        await fetch(`${redisUrl}/hset/${msgKey}/status/processing`, { headers: authHeader }).catch(() => {});

        // CAPTCHA Verification
        if (turnstileSecret && turnstileSecret !== 'your_secret_key_here' && item.captchaToken) {
          try {
            const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `secret=${turnstileSecret}&response=${item.captchaToken}`,
            });
            const vData = await vRes.json();
            if (!vData.success) {
              console.warn(`[Worker] Turnstile failed for msg:${item.msg_id}. Errors: ${JSON.stringify(vData['error-codes'])}`);
              await fetch(`${redisUrl}/hset/${msgKey}/status/rejected`, { headers: authHeader }).catch(() => {});
              return null;
            }
          } catch (e) { 
            console.error(`[Worker] Turnstile fetch error for msg:${item.msg_id}:`, e.message);
            // On network error, we might want to retry or just allow? 
            // Better to allow and log to avoid blocking valid submissions during Cloudflare outages.
          }
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

        if (bulkSubmitError) {
            console.error("[Worker] Bulk insert error:", bulkSubmitError.message);
            // Move items back or handle error? For now, we throw and let the processingList be cleaned up or persisted.
            throw bulkSubmitError;
        }

        if (!insertedSubmissions || insertedSubmissions.length === 0) {
            console.error("[Worker] Insert returned no data");
            throw new Error("Bulk insert failed to return rows");
        }

        // STAGE 2: Bulk Insert Files
        const fileRecords: any[] = [];
        insertedSubmissions.forEach((sub, index) => {
          const originalItem = validItems[index];
          const originalFiles = originalItem.files;
          if (originalFiles && Array.isArray(originalFiles) && originalFiles.length > 0) {
            originalFiles.forEach((f: any) => {
              fileRecords.push({
                submission_id: sub.id,
                file_path: f.path,
                file_name: f.fileName || f.name || "unknown",
                file_size: f.size || 0,
                mime_type: f.mimeType || f.mime_type || "application/octet-stream",
              });
            });
          }
        });
        
        if (fileRecords.length > 0) {
            const { error: fileError } = await supabase.from("files").insert(fileRecords);
            if (fileError) console.error("[Worker] File insert error:", fileError.message);
        }

        // STAGE 3: Integrations & Completion
        const uniqueFormIds = [...new Set(validItems.map(i => i.form_id))];
        const configMap = new Map();

        // Config Caching
        try {
            const redisMgetRes = await fetch(`${redisUrl}/mget/${uniqueFormIds.map(id => `form:${id}:meta`).join('/')}`, { headers: authHeader });
            const redisMgetData = await redisMgetRes.json();
            const cachedConfigs = redisMgetData.result || [];

            const missingFormIds: string[] = [];
            uniqueFormIds.forEach((id, idx) => {
                const cached = cachedConfigs[idx];
                if (cached) {
                    try {
                        configMap.set(id, typeof cached === 'string' ? JSON.parse(cached) : cached);
                    } catch { missingFormIds.push(id); }
                } else { missingFormIds.push(id); }
            });

            if (missingFormIds.length > 0) {
                const { data: dbConfigs } = await supabase.from("forms").select("*").in("id", missingFormIds);
                if (dbConfigs) {
                    for (const conf of dbConfigs) {
                        configMap.set(conf.id, conf);
                        await fetch(`${redisUrl}/setex/form:${conf.id}:meta/60/${encodeURIComponent(JSON.stringify(conf))}`, { headers: authHeader }).catch(() => {});
                    }
                }
            }
        } catch (e) {
            console.error("[Worker] Config fetch error:", e.message);
            // Fallback: try to fetch individual configs during integration step
        }

        // Run Integrations
        await Promise.allSettled(insertedSubmissions.map(async (sub, idx) => {
          const formConfig = configMap.get(sub.form_id);
          const originalItem = validItems[idx];
          if (formConfig) {
              await runIntegrations(formConfig, sub, sub.data).catch(e => console.error(`[Worker] Integration failed for sub:${sub.id}:`, e.message));
          }
          await fetch(`${redisUrl}/hset/msg:${originalItem.msg_id}/status/completed`, { headers: authHeader }).catch(() => {});
        }));

        totalProcessed += validItems.length;
      }

      // Cleanup processing list after successful batch processing
      await fetch(`${redisUrl}/del/${encodeURIComponent(processingList)}`, { headers: authHeader }).catch(() => {});
    }

    console.log(`[Worker] Finished. Processed ${totalProcessed} items.`);
    return new Response(JSON.stringify({ success: true, processed: totalProcessed }), {
        headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[Worker] Global Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
});

async function runIntegrations(formConfig: any, submission: any, data: any) {
  const tasks = [];

  // SLACK
  if (formConfig.slack_enabled && formConfig.slack_bot_token && formConfig.slack_channel_id) {
    tasks.push((async () => {
      try {
        const token = await decrypt(formConfig.slack_bot_token);
        const { data: flds } = await supabase.from('form_fields').select('id, label').eq('form_id', formConfig.id);
        const blocks = [
          { type: "header", text: { type: "plain_text", text: "New Submission" } },
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
      } catch (e) { console.error("[Slack Error]", e.message); }
    })());
  }

  // ZAPIER
  if (formConfig.zapier_enabled && formConfig.zapier_webhook_url) {
    tasks.push((async () => {
      try {
        const url = await decrypt(formConfig.zapier_webhook_url);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submission.id, ...data })
        });
        if (res.ok) await supabase.from('submissions').update({ zapier_synced: true }).eq('id', submission.id);
      } catch (e) { console.error("[Zapier Error]", e.message); }
    })());
  }

  // AIRTABLE
  if (formConfig.airtable_enabled && formConfig.airtable_api_key && formConfig.airtable_base_id) {
    tasks.push((async () => {
      try {
        const key = await decrypt(formConfig.airtable_api_key);
        const res = await fetch(`https://api.airtable.com/v0/${formConfig.airtable_base_id}/${encodeURIComponent(formConfig.airtable_table_name || 'Submissions')}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: [{ fields: { ...data, "Submission Date": submission.submitted_at } }] })
        });
        if (res.ok) await supabase.from('submissions').update({ airtable_synced: true }).eq('id', submission.id);
      } catch (e) { console.error("[Airtable Error]", e.message); }
    })());
  }

  // EMAIL
  if (formConfig.email_enabled && formConfig.notification_email && formConfig.email_app_password) {
    tasks.push((async () => {
      try {
        const pass = await decrypt(formConfig.email_app_password);
        const transporter = nodemailer.createTransport({
          host: formConfig.email_host || 'smtp.gmail.com',
          port: formConfig.email_port || 465,
          secure: formConfig.email_secure ?? true,
          auth: { user: formConfig.notification_email, pass },
        });
        await transporter.sendMail({
          from: `"FormFlow AI" <${formConfig.notification_email}>`,
          to: formConfig.email_to_list || formConfig.notification_email,
          subject: `New Submission: ${formConfig.title}`,
          html: `<p>You received a new submission for <b>${formConfig.title}</b>.</p><pre>${JSON.stringify(data, null, 2)}</pre>`
        });
        await supabase.from('submissions').update({ email_synced: true }).eq('id', submission.id);
      } catch (e) { console.error("[Email Error]", e.message); }
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
        } catch (e) { console.error("[Google Sheets Error]", e.message); }
    })());
  }

  // NOTION
  if (formConfig.notion_enabled && formConfig.notion_api_key && formConfig.notion_database_id) {
    tasks.push((async () => {
      try {
        const apiKey = await decrypt(formConfig.notion_api_key);
        const databaseId = await decrypt(formConfig.notion_database_id);

        // 1. Fetch Database Schema
        const schemaRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28'
          }
        });
        
        const schema = schemaRes.ok ? await schemaRes.json() : { properties: {} };
        const schemaProps = schema.properties || {};
        const existingProps = Object.keys(schemaProps);

        // 2. Prepare Properties & Missing Columns
        const properties: Record<string, any> = {};
        const missingProps: Record<string, any> = {};
        let titleKey = Object.keys(data).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('subject')) || Object.keys(data)[0];

        for (const [key, value] of Object.entries(data)) {
          const sanitizedKey = key.replace(/[\[\]]/g, '');
          const propType = schemaProps[sanitizedKey]?.type;

          if (key === titleKey || sanitizedKey === 'Name') {
            properties['Name'] = { title: [{ text: { content: String(value || 'Untitled') } }] };
          } else if (propType) {
            switch (propType) {
              case 'email': properties[sanitizedKey] = { email: String(value || '') }; break;
              case 'url': properties[sanitizedKey] = { url: String(value || '') }; break;
              case 'number': properties[sanitizedKey] = { number: Number(value) || 0 }; break;
              case 'phone_number': properties[sanitizedKey] = { phone_number: String(value || '') }; break;
              case 'date': properties[sanitizedKey] = { date: { start: new Date(String(value)).toISOString() } }; break;
              case 'checkbox': properties[sanitizedKey] = { checkbox: Boolean(value) }; break;
              case 'select': properties[sanitizedKey] = { select: { name: String(value) } }; break;
              default: properties[sanitizedKey] = { rich_text: [{ text: { content: String(value || '') } }] };
            }
          } else {
            properties[sanitizedKey] = { rich_text: [{ text: { content: String(value || '') } }] };
            missingProps[sanitizedKey] = { rich_text: {} };
          }
        }


        if (!properties['Name']) {
          properties['Name'] = { title: [{ text: { content: `Submission ${submission.id.slice(0, 8)}` } }] };
        }

        // 3. Auto-Create Columns
        if (Object.keys(missingProps).length > 0) {
          await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ properties: missingProps })
          });
        }

        // 4. Create Page
        const res = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parent: { database_id: databaseId },
            properties
          })
        });

        if (res.ok) {
          await supabase.from('submissions').update({ notion_synced: true }).eq('id', submission.id);
        } else {
          const err = await res.json();
          console.error("[Notion Error]", err.message);
        }
      } catch (e) { console.error("[Notion Error]", e.message); }
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
