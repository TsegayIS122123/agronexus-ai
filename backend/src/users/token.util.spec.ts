import { hashToken, generateNumericOtp, issueToken } from './token.util';
import { MIN_SECRET_KEY_LENGTH, validateEnv } from '../config/env.validation';

describe('token.util', () => {
  describe('issueToken', () => {
    it('returns a raw value and a hash that are not equal', () => {
      const issued = issueToken();
      expect(issued.raw).not.toBe(issued.hash);
      expect(issued.hash).toHaveLength(64);
    });

    it('never repeats', () => {
      const seen = new Set(Array.from({ length: 200 }, () => issueToken().raw));
      expect(seen.size).toBe(200);
    });
  });

  describe('hashToken', () => {
    it('is stable and hex', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
      expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('differs for different inputs', () => {
      expect(hashToken('abc')).not.toBe(hashToken('abd'));
    });
  });

  describe('generateNumericOtp', () => {
    it('produces the requested length', () => {
      expect(generateNumericOtp()).toHaveLength(6);
      expect(generateNumericOtp(8)).toHaveLength(8);
    });

    it('only ever emits digits', () => {
      for (let i = 0; i < 100; i++) {
        expect(generateNumericOtp()).toMatch(/^[0-9]{6}$/);
      }
    });

    it('uses all ten digits, not just the first six', () => {
      // A modulo against the code length instead of the digit count would make
      // every digit 0-5 and shrink the keyspace to 6^6.
      const firstDigits = new Set(
        Array.from({ length: 400 }, () => generateNumericOtp()[0]),
      );
      expect([...firstDigits].sort()).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
      ]);
    });

    it('does not favour low digits', () => {
      const counts = new Map<string, number>();
      for (let i = 0; i < 4000; i++) {
        for (const digit of generateNumericOtp()) {
          counts.set(digit, (counts.get(digit) ?? 0) + 1);
        }
      }
      expect(counts.size).toBe(10);
      // 24000 samples over 10 digits: ~2400 each. A wide band still proves the
      // distribution is not collapsing onto a subset.
      for (const [, count] of counts) {
        expect(count).toBeGreaterThan(1800);
        expect(count).toBeLessThan(3000);
      }
    });
  });
});

describe('validateEnv', () => {
  const valid = {
    DB_HOST: 'localhost',
    DB_USER: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_NAME: 'agronexus',
    JWT_SECRET: 'a'.repeat(64),
    JWT_REFRESH_SECRET: 'b'.repeat(64),
  };

  it('accepts a complete environment', () => {
    expect(() => validateEnv(valid)).not.toThrow();
  });

  it('lists every missing variable at once', () => {
    expect(() => validateEnv({})).toThrow(/DB_HOST.*DB_USER.*JWT_SECRET/s);
  });

  it('rejects a short signing key', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'tooshort' })).toThrow(
      new RegExp(`${MIN_SECRET_KEY_LENGTH}`),
    );
  });

  it('rejects identical access and refresh secrets', () => {
    // Otherwise an access token could be presented where a refresh token is
    // expected and used to mint a long-lived session.
    expect(() => validateEnv({ ...valid, JWT_REFRESH_SECRET: valid.JWT_SECRET })).toThrow(
      /must differ/,
    );
  });

  it('treats whitespace as missing', () => {
    expect(() => validateEnv({ ...valid, DB_HOST: '   ' })).toThrow(/DB_HOST/);
  });
});
