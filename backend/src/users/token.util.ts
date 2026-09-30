import { createHash, randomBytes } from 'crypto';

export const TOKEN_BYTES = 32;

export interface IssuedToken {
  /** The value handed to the user. Never persisted. */
  raw: string;
  /** SHA-256 hex digest, which is what gets stored. */
  hash: string;
}

export function issueToken(bytes: number = TOKEN_BYTES): IssuedToken {
  const raw = randomBytes(bytes).toString('hex');
  return { raw, hash: hashToken(raw) };
}

/**
 * SHA-256 is correct for high-entropy random tokens because the input space is
 * too large to brute force. It is NOT correct for low-entropy secrets like a
 * 6-digit OTP — see OtpCode, which stores bcrypt instead.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export const NUMERIC_OTP_LENGTH = 6;
export const NUMERIC_OTP_MAX_ATTEMPTS = 5;

/**
 * Uniform numeric code from a CSPRNG. `Math.random` is not acceptable here.
 *
 * The modulo is against the number of digits (10), not the code length. Using
 * the length here would silently restrict a 6-digit code to the digits 0-5 and
 * cut the keyspace from 10^6 to 6^6.
 */
export function generateNumericOtp(length: number = NUMERIC_OTP_LENGTH): string {
  const DIGITS = 10;
  // Largest multiple of 10 that fits in a uint32; values at or above it are
  // rejected so every digit stays exactly equally likely.
  const limit = Math.floor(0xffffffff / DIGITS) * DIGITS;
  let out = '';
  while (out.length < length) {
    const value = randomBytes(4).readUInt32BE(0);
    if (value >= limit) continue;
    out += String(value % DIGITS);
  }
  return out;
}
