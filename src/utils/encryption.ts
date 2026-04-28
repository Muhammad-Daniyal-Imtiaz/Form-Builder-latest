import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
  randomBytes,
} from 'node:crypto';

const DEV_FALLBACK_SECRET = 'form-builder-development-secret';
const NEW_FORMAT_PREFIX = 'enc:v2';

let warnedAboutFallbackSecret = false;

function resolveSecret() {
  const configuredSecret = process.env.ENCRYPTION_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_SECRET must be configured in production');
  }

  if (!warnedAboutFallbackSecret) {
    console.warn('[Encryption] Using the development fallback ENCRYPTION_SECRET.');
    warnedAboutFallbackSecret = true;
  }

  return DEV_FALLBACK_SECRET;
}

function deriveCurrentKey(secret: string) {
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }

  return createHash('sha256').update(secret, 'utf8').digest();
}

function deriveLegacyKey(secret: string) {
  return pbkdf2Sync(secret, 'salt', 100, 32, 'sha1');
}

function toBase64Url(buffer: Buffer) {
  return buffer.toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url');
}

function encryptCurrent(text: string, secret: string) {
  const key = deriveCurrentKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    NEW_FORMAT_PREFIX,
    toBase64Url(iv),
    toBase64Url(encrypted),
    toBase64Url(authTag),
  ].join(':');
}

function decryptCurrent(text: string, secret: string) {
  const [, , ivPart, encryptedPart, authTagPart] = text.split(':');

  if (!ivPart || !encryptedPart || !authTagPart) {
    throw new Error('Invalid encrypted payload');
  }

  const key = deriveCurrentKey(secret);
  const decipher = createDecipheriv('aes-256-gcm', key, fromBase64Url(ivPart));
  decipher.setAuthTag(fromBase64Url(authTagPart));

  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(encryptedPart)),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

function decryptLegacy(text: string, secret: string) {
  const parts = text.split(':');
  const ivHex = parts.shift();
  const encryptedText = parts.join(':');

  if (!ivHex || ivHex.length !== 32 || !encryptedText) {
    return text;
  }

  try {
    const key = deriveLegacyKey(secret);
    const decipher = createDecipheriv(
      'aes-256-cbc',
      key,
      Buffer.from(ivHex, 'hex')
    );

    const decrypted = Buffer.concat([
      decipher.update(encryptedText, 'base64'),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    return text;
  }
}

export function encrypt(text: string) {
  if (!text) {
    return text;
  }

  return encryptCurrent(text, resolveSecret());
}

export function decrypt(text: string) {
  if (!text) {
    return text;
  }

  const secret = resolveSecret();

  if (text.startsWith(`${NEW_FORMAT_PREFIX}:`)) {
    try {
      return decryptCurrent(text, secret);
    } catch {
      return text;
    }
  }

  if (text.includes(':')) {
    return decryptLegacy(text, secret);
  }

  return text;
}
