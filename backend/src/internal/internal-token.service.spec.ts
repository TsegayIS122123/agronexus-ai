import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  INTERNAL_TOKEN_HEADER,
  INTERNAL_TOKEN_TTL_SECONDS,
  INTERNAL_TOKEN_TYPE,
  INTERNAL_USER_HEADER,
  InternalTokenService,
} from './internal-token.service';

const INTERNAL_SECRET = 'i'.repeat(64);
const ACCESS_SECRET = 'a'.repeat(64);

function makeService(env: Record<string, string | undefined>) {
  const config = { get: (key: string) => env[key] } as unknown as ConfigService;
  return new InternalTokenService(config, new JwtService({}));
}

describe('InternalTokenService', () => {
  it('mints a token signed with INTERNAL_SERVICE_SECRET, not JWT_SECRET', async () => {
    const service = makeService({
      INTERNAL_SERVICE_SECRET: INTERNAL_SECRET,
      JWT_SECRET: ACCESS_SECRET,
    });

    const token = await service.mint('user-1');

    // Decoding with the user key must fail; that is the property that stops a
    // user access token from being replayable as a service credential.
    const jwt = new JwtService({});
    expect(() => jwt.verify(token, { secret: ACCESS_SECRET })).toThrow();
    expect(jwt.verify(token, { secret: INTERNAL_SECRET })).toMatchObject({
      sub: 'user-1',
      typ: INTERNAL_TOKEN_TYPE,
    });
  });

  it('sends both headers together, so the signature and the subject travel as a pair', async () => {
    const service = makeService({ INTERNAL_SERVICE_SECRET: INTERNAL_SECRET });

    const headers = await service.headers('user-1');

    expect(headers[INTERNAL_TOKEN_HEADER]).toBeTruthy();
    expect(headers[INTERNAL_USER_HEADER]).toBe('user-1');
  });

  it('refuses to mint when the secret is unset rather than signing with a default', async () => {
    const service = makeService({ INTERNAL_SERVICE_SECRET: undefined });

    await expect(service.mint('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('refuses a secret shorter than the minimum', async () => {
    const service = makeService({ INTERNAL_SERVICE_SECRET: 'too-short' });

    await expect(service.mint('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('refuses to mint without an acting user', async () => {
    const service = makeService({ INTERNAL_SERVICE_SECRET: INTERNAL_SECRET });

    await expect(service.mint('')).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('expires in a minute, not a session lifetime', async () => {
    const service = makeService({ INTERNAL_SERVICE_SECRET: INTERNAL_SECRET });
    const token = await service.mint('user-1');

    const decoded = new JwtService({}).decode<{ exp: number; iat: number }>(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.exp - decoded!.iat).toBe(INTERNAL_TOKEN_TTL_SECONDS);
    expect(INTERNAL_TOKEN_TTL_SECONDS).toBeLessThanOrEqual(120);
  });

  it('carries no role claim, because ai-service reads the role from the row', async () => {
    const service = makeService({ INTERNAL_SERVICE_SECRET: INTERNAL_SECRET });
    const token = await service.mint('user-1');

    const decoded = new JwtService({}).decode<Record<string, unknown>>(token);
    expect(decoded).not.toHaveProperty('role');
  });
});
