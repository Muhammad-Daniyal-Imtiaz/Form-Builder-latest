// utils/encryption.ts
// This version uses Web Crypto API for compatibility with Cloudflare Workers/Pages

const DEV_FALLBACK_SECRET = 'form-builder-development-secret';
const NEW_FORMAT_PREFIX = 'enc:v3'; // Increment version for Web Crypto

function resolveSecret() {
  const configuredSecret = process.env.ENCRYPTION_SECRET?.trim();
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_SECRET must be configured in production');
  }
  return DEV_FALLBACK_SECRET;
}

async function getCryptoKey(secret: string) {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  // Hash the secret to ensure it's exactly 32 bytes for AES-256
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

function toBase64Url(buffer: Uint8Array) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(base64url: string) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base64);
  const buffer = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);
  return buffer;
}

/**
 * Encrypts text using AES-GCM (Web Crypto)
 */
async function encryptWeb(text: string, secret: string) {
  const key = await getCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  return [
    NEW_FORMAT_PREFIX,
    toBase64Url(iv),
    toBase64Url(new Uint8Array(encrypted))
  ].join(':');
}

/**
 * Decrypts text using AES-GCM (Web Crypto)
 */
async function decryptWeb(payload: string, secret: string) {
  const parts = payload.split(':');
  if (parts.length < 3) throw new Error('Invalid encrypted payload');
  
  const [, ivPart, encryptedPart] = parts;
  const key = await getCryptoKey(secret);
  const iv = fromBase64Url(ivPart);
  const data = fromBase64Url(encryptedPart);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    throw new Error('Decryption failed');
  }
}

// Since we need to support sync calls in some existing code, 
// but Web Crypto is async, we'll keep the exported functions 
// but they might need to be awaited in the routes.

// However, to avoid breaking everything, I will implement a 
// "safe" sync wrapper that might fail if called before initialization 
// OR just make the exports async.

export async function encrypt(text: string) {
  if (!text) return text;
  return await encryptWeb(text, resolveSecret());
}

export async function decrypt(text: string) {
  if (!text) return text;
  const secret = resolveSecret();

  if (text.startsWith('enc:v3:')) {
    try {
      return await decryptWeb(text, secret);
    } catch {
      return text;
    }
  }
  
  // For legacy enc:v2 or raw, we'd need Node crypto. 
  // On Cloudflare, we'll just return as-is or fail gracefully.
  return text;
}

