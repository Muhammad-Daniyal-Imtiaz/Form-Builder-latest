const crypto = require('crypto');

const DEV_FALLBACK_SECRET = 'form-builder-development-secret';
const NEW_FORMAT_PREFIX = 'enc:v3';

function resolveSecret() {
  return DEV_FALLBACK_SECRET;
}

async function getCryptoKey(secret) {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const hash = await crypto.webcrypto.subtle.digest('SHA-256', keyData);
  return await crypto.webcrypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

function fromBase64Url(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base64);
  const buffer = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);
  return buffer;
}

async function decryptWeb(payload, secret) {
  const parts = payload.split(':');
  
  const ivPart = parts[2];
  const encryptedPart = parts[3];
  
  const key = await getCryptoKey(secret);
  const iv = fromBase64Url(ivPart);
  const data = fromBase64Url(encryptedPart);

  try {
    const decrypted = await crypto.webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    throw new Error('Decryption failed: ' + e.message);
  }
}

async function test() {
  const encKey = 'enc:v3:AfxmncSuYISKdFX7:JRUeb5sbadCcHMxovByQtGPsqC8ZgojNKW8KCv_Hne10KBw7Ljf2Iisr_BUVMVYD8VuuNLLDjNEmHc4Fp1_rnjUf';
  try {
    const dec = await decryptWeb(encKey, resolveSecret());
    console.log('Decrypted successfully!');
  } catch(e) {
    console.error(e);
  }
}

test();
