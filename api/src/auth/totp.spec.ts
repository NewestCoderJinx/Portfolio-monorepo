import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  currentStep,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  otpauthUri,
  totpAt,
  verifyTotp,
} from './totp';

// RFC 6238 appendix B, SHA-1 key.
const RFC_KEY = Buffer.from('12345678901234567890');

describe('TOTP', () => {
  it('matches the RFC 6238 test vectors', () => {
    expect(totpAt(RFC_KEY, Math.floor(59 / 30), 8)).toBe('94287082');
    expect(totpAt(RFC_KEY, Math.floor(1111111109 / 30), 8)).toBe('07081804');
    expect(totpAt(RFC_KEY, Math.floor(2000000000 / 30), 8)).toBe('69279037');
    expect(totpAt(RFC_KEY, Math.floor(20000000000 / 30), 8)).toBe('65353130');
  });

  it('round-trips base32', () => {
    expect(base32Encode(RFC_KEY)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode('gezd gnbv-gy3tqojqgezdgnbvgy3tqojq')).toEqual(RFC_KEY);
    expect(base32Decode(generateTotpSecret())).toHaveLength(20);
  });

  it('accepts the current code and one step of drift either way', () => {
    const secret = generateTotpSecret();
    const now = 1_800_000_000_000;
    const step = currentStep(now);
    const key = base32Decode(secret);
    expect(verifyTotp(secret, totpAt(key, step), null, now)).toBe(step);
    expect(verifyTotp(secret, totpAt(key, step - 1), null, now)).toBe(step - 1);
    expect(verifyTotp(secret, totpAt(key, step + 1), null, now)).toBe(step + 1);
    expect(verifyTotp(secret, totpAt(key, step - 2), null, now)).toBeNull();
  });

  it('refuses a code that was already used, and junk', () => {
    const secret = generateTotpSecret();
    const now = 1_800_000_000_000;
    const step = currentStep(now);
    const code = totpAt(base32Decode(secret), step);
    expect(verifyTotp(secret, code, step, now)).toBeNull();
    expect(verifyTotp(secret, 'abcdef', null, now)).toBeNull();
    expect(verifyTotp(secret, '12345', null, now)).toBeNull();
    expect(verifyTotp(secret, `${code.slice(0, 3)} ${code.slice(3)}`, null, now)).toBe(step);
  });

  it('builds an otpauth link apps understand', () => {
    expect(otpauthUri('ABC', 'me@example.com', 'My Site')).toBe(
      'otpauth://totp/My%20Site%3Ame%40example.com?secret=ABC&issuer=My+Site&algorithm=SHA1&digits=6&period=30',
    );
  });

  it('makes distinct recovery codes whose hash ignores case and dashes', () => {
    const codes = generateRecoveryCodes();
    expect(new Set(codes).size).toBe(10);
    expect(codes[0]).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/);
    expect(hashRecoveryCode(codes[0].toUpperCase().replace('-', ' '))).toBe(hashRecoveryCode(codes[0]));
  });
});
