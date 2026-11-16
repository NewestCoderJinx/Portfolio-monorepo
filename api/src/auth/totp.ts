import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';

/**
 * Time-based one-time passwords (RFC 6238) as used by authenticator apps: HMAC-SHA1, 6 digits, 30-second steps.
 */
export const TOTP_STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new random secret (160 bits, as RFC 4226 recommends), base32 for typing into an app. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The code for a given 30-second step number. */
export function totpAt(secret: Buffer, step: number, digits = DIGITS): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac('sha1', secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, '0');
}

export const currentStep = (nowMs = Date.now()) => Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS);

/**
 * The step `code` matches, allowing one step either side for clock drift, or null.
 * Steps at or before `lastUsedStep` are refused so a code can't be replayed.
 */
export function verifyTotp(secretBase32: string, code: string, lastUsedStep: number | null, nowMs = Date.now()): number | null {
  const digits = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(digits)) return null;
  const secret = base32Decode(secretBase32);
  const now = currentStep(nowMs);
  for (const step of [now - 1, now, now + 1]) {
    if (lastUsedStep !== null && step <= lastUsedStep) continue;
    if (timingSafeEqual(Buffer.from(totpAt(secret, step)), Buffer.from(digits))) return step;
  }
  return null;
}

/** The link an authenticator app reads from the QR code. */
export function otpauthUri(secretBase32: string, account: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret: secretBase32, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(TOTP_STEP_SECONDS) });
  return `otpauth://totp/${label}?${params}`;
}

/** Ten one-use recovery codes like "k3m9p-x2c7w", for when the phone is lost. */
export function generateRecoveryCodes(count = 10): string[] {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/o, 1/l/i
  return Array.from({ length: count }, () => {
    const chars = Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join('');
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

/** Recovery codes are random enough that a plain SHA-256 is a safe way to store them. */
export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

export const normalizeRecoveryCode = (code: string) => code.toLowerCase().replace(/[^a-z0-9]/g, '');
