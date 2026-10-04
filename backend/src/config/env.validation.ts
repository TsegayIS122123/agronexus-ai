/**
 * Boot-time environment validation.
 *
 * ai-service already validates SECRET_KEY at startup; this mirrors that rule so a
 * weak or missing key never reaches a signing call. Anything listed in REQUIRED
 * must be present and non-empty or the process refuses to start.
 */

export const MIN_SECRET_KEY_LENGTH = 32;

export interface ValidatedEnv {
  [key: string]: string | undefined;
}

const REQUIRED = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export function validateEnv(raw: Record<string, unknown>): ValidatedEnv {
  const env: ValidatedEnv = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== null) {
      env[key] = String(value);
    }
  }

  const missing = REQUIRED.filter((key) => !env[key] || env[key]!.trim() === '');
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy backend/.env.example to backend/.env and fill it in.',
    );
  }

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    const value = env[key]!;
    if (value.length < MIN_SECRET_KEY_LENGTH) {
      throw new Error(
        `${key} must be at least ${MIN_SECRET_KEY_LENGTH} characters (got ${value.length}).`,
      );
    }
  }

  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_SECRET and JWT_REFRESH_SECRET must differ so a stolen access token ' +
        'cannot be used to mint a refresh token.',
    );
  }

  validateInternalServiceSecret(env);

  return env;
}

/**
 * INTERNAL_SERVICE_SECRET is optional at boot on purpose: today's browser path
 * tolerates an unconfigured secret rather than breaking. When present it is
 * validated exactly like the others, and it must not collide with a user key:
 * a shared key would make an access token a valid internal service credential
 * (and the reverse), which is the whole thing the split exists to prevent.
 */
function validateInternalServiceSecret(env: ValidatedEnv): void {
  const value = env.INTERNAL_SERVICE_SECRET;
  if (!value || value.trim() === '') return;

  if (value.length < MIN_SECRET_KEY_LENGTH) {
    throw new Error(
      `INTERNAL_SERVICE_SECRET must be at least ${MIN_SECRET_KEY_LENGTH} characters (got ${value.length}).`,
    );
  }

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (env[key] === value) {
      throw new Error(
        `INTERNAL_SERVICE_SECRET must differ from ${key}. Sharing a key would ` +
          'let a user token be replayed as a backend-to-ai-service call.',
      );
    }
  }
}
