import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import request from 'supertest';
import * as crypto from 'crypto';

import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { EMAIL_DELIVERY } from '../src/notifications/notifications.module';
import { SMS_DELIVERY } from '../src/notifications/sms.module';
import { applyGlobalPipes, testDatabaseName } from './test-helpers';

/**
 * Captures outbound messages so a test can read back the token or code that a
 * real user would have received. No provider is contacted.
 */
class CapturedEmail {
  sent: { to: string; subject: string; body: string }[] = [];
  async send(input: { to: string; subject: string; body: string }) {
    this.sent.push(input);
  }
  lastToken(): string {
    const body = this.sent[this.sent.length - 1].body;
    return body.slice(body.lastIndexOf('token=') + 'token='.length);
  }
}

class CapturedSms {
  sent: { to: string; message: string }[] = [];
  async send(input: { to: string; message: string }) {
    this.sent.push(input);
  }
  lastCode(): string {
    return this.sent[this.sent.length - 1].message.split(' ')[0];
  }
}

let app: INestApplication;
let moduleRef: TestingModule;
let email: CapturedEmail;
let sms: CapturedSms;
let throttler: ThrottlerStorageService;
let server: ReturnType<INestApplication['getHttpServer']>;

const uniqueEmail = () => `e2e-${crypto.randomUUID()}@example.com`;
const uniquePhone = () =>
  `+2519${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`;

function registerBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'E2E User',
    email: uniqueEmail(),
    phone: uniquePhone(),
    password: 'sup3r-secret-pw',
    language: 'en',
    ...overrides,
  };
}

beforeAll(async () => {
  // The environment is already pinned by test/setup-e2e-env.ts, which Jest runs
  // before this file is imported. ConfigModule snapshots it at import time, so
  // re-assigning here would be too late to have any effect.
  expect(process.env.DB_NAME).toBe(testDatabaseName());

  email = new CapturedEmail();
  sms = new CapturedSms();

  moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EMAIL_DELIVERY)
    .useValue(email)
    .overrideProvider(SMS_DELIVERY)
    .useValue(sms)
    .compile();

  app = moduleRef.createNestApplication();
  applyGlobalPipes(app);
  await app.init();
  server = app.getHttpServer();
  throttler = app.get(ThrottlerStorage) as ThrottlerStorageService;
});

afterAll(async () => {
  await app?.close();
});

beforeEach(async () => {
  // Clear the identity rows and any leftover accounts so each case is isolated
  // without depending on execution order.
  await moduleRef
    .get(UsersService)
    ['users'].query(
      'TRUNCATE email_verifications, password_reset_tokens, otp_codes, refresh_tokens, users CASCADE',
    );
  // The throttle storage is keyed by client IP, which is identical for every
  // supertest request, so counters must be reset between cases.
  //
  // ThrottlerStorageService keeps two maps: the hit records and a parallel map
  // of per-hit expiry timestamps. Clearing only the records leaves those
  // timestamps behind, and the next request is resurrected with every earlier
  // hit still counted - which is why unrelated tests were rejected with 429.
  // The library exposes no reset, but its shutdown hook clears both maps and
  // the sweep timer is restarted by the next increment().
  throttler.onApplicationShutdown();
  email.sent.length = 0;
  sms.sent.length = 0;
});

const api = () => request(server);

describe('Auth e2e (real HTTP, real Postgres)', () => {
  describe('register', () => {
    it('creates an unverified account and stores only the hash of the token', async () => {
      const body = registerBody();
      const res = await api().post('/api/v1/auth/register').send(body).expect(201);

      expect(res.body.user.email).toBe(body.email);
      expect(res.body.user.isVerified).toBe(false);
      expect(res.body.user).not.toHaveProperty('passwordHash');

      expect(email.sent).toHaveLength(1);
      const rawToken = email.lastToken();

      const stored = await moduleRef
        .get(UsersService)
        ['verifications'].findOne({ where: {} });
      if (!stored) throw new Error('no email_verifications row was written');
      expect(stored.tokenHash).not.toBe(rawToken);
      expect(stored.tokenHash).toHaveLength(64);
    });

    it('rejects a duplicate email', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      const res = await api().post('/api/v1/auth/register').send(body).expect(403);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('rejects a duplicate phone', async () => {
      const phone = uniquePhone();
      await api().post('/api/v1/auth/register').send(registerBody({ phone })).expect(201);
      await api().post('/api/v1/auth/register').send(registerBody({ phone })).expect(403);
    });

    it('rejects unknown fields so a caller cannot set isVerified directly', async () => {
      const res = await api()
        .post('/api/v1/auth/register')
        .send(registerBody({ isVerified: true }))
        .expect(400);
      expect(JSON.stringify(res.body.message)).toMatch(/isVerified/);
    });

    it('rejects a weak password', async () => {
      await api()
        .post('/api/v1/auth/register')
        .send(registerBody({ password: 'short' }))
        .expect(400);
    });
  });

  describe('login gating', () => {
    it('refuses an unverified account with an actionable message', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);

      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password })
        .expect(403);

      expect(res.body.message).toMatch(/not verified/i);
      expect(res.body.message).toMatch(/inbox/i);
    });

    it('succeeds after verification', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);

      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password })
        .expect(200);

      expect(res.body.user.isVerified).toBe(true);
      expect(res.body.tokens.accessToken).toBeTruthy();
      expect(res.body.tokens.refreshToken).toBeTruthy();
    });

    it('gives an identical error for a wrong password and an unknown account', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);

      const wrongPassword = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: 'wrong-password' })
        .expect(401);

      const unknownUser = await api()
        .post('/api/v1/auth/login')
        .send({ email: uniqueEmail(), password: 'wrong-password' })
        .expect(401);

      expect(wrongPassword.body.message).toBe(unknownUser.body.message);
    });
  });

  describe('verify-email', () => {
    it('accepts a token exactly once', async () => {
      await api().post('/api/v1/auth/register').send(registerBody()).expect(201);
      const token = email.lastToken();

      await api().post('/api/v1/auth/verify-email').send({ token }).expect(200);

      const replay = await api()
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(403);
      expect(replay.body.message).toMatch(/invalid or has expired/i);
    });

    it('gives the same error for an unknown token and an already-used one', async () => {
      await api().post('/api/v1/auth/register').send(registerBody()).expect(201);
      const token = email.lastToken();
      await api().post('/api/v1/auth/verify-email').send({ token }).expect(200);

      const used = await api()
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(403);
      const unknown = await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: 'f'.repeat(64) })
        .expect(403);

      expect(used.body.message).toBe(unknown.body.message);
    });

    it('rejects an expired token', async () => {
      await api().post('/api/v1/auth/register').send(registerBody()).expect(201);
      const token = email.lastToken();

      await moduleRef
        .get(UsersService)
        ['verifications'].query(
          "UPDATE email_verifications SET expires_at = now() - interval '1 minute'",
        );

      await api().post('/api/v1/auth/verify-email').send({ token }).expect(403);
    });

    it('enforces the resend cooldown independently of the throttle', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);

      // Registration already sent one, so the 60s application cooldown is
      // active before the throttle has seen more than a single request.
      const res = await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: body.email });

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body.message)).toMatch(/wait/i);
    });

    it('rate limits repeated resends', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);

      // Two independent limits guard this route: an application cooldown that
      // answers 403 for 60s, and a per-route throttle of 3 per minute. Age the
      // verification rows past the cooldown before each call so the throttle is
      // the only thing under test here.
      const expireCooldown = () =>
        moduleRef
          .get(UsersService)
          ['verifications'].query(
            "UPDATE email_verifications SET created_at = now() - interval '10 minutes'",
          );

      await expireCooldown();
      await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: body.email })
        .expect(200);
      await expireCooldown();
      await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: body.email })
        .expect(200);
      await expireCooldown();
      await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: body.email })
        .expect(200);

      // The fourth request in the same minute exceeds the limit of 3.
      const blocked = await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: body.email });

      expect(blocked.status).toBe(429);
    });
  });

  describe('password reset', () => {
    it('changes the password and revokes existing refresh tokens', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);

      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password })
        .expect(200);
      const oldRefresh = login.body.tokens.refreshToken;

      await api()
        .post('/api/v1/auth/request-password-reset')
        .send({ email: body.email })
        .expect(200);

      const resetToken = email.lastToken();
      await api()
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, newPassword: 'brand-new-password' })
        .expect(200);

      // The session opened with the old password must be dead.
      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefresh })
        .expect(401);

      // And the new password works, the old one does not.
      await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: 'brand-new-password' })
        .expect(200);
      // The address is verified in this flow, so a wrong password is a plain
      // credential failure rather than the unverified gate.
      await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password })
        .expect(401);
    });

    it('rejects a reset link twice', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/request-password-reset')
        .send({ email: body.email })
        .expect(200);
      const token = email.lastToken();

      await api()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'another-password' })
        .expect(200);
      await api()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'yet-another-pw' })
        .expect(403);
    });

    it('does not disclose whether an address exists', async () => {
      const res = await api()
        .post('/api/v1/auth/request-password-reset')
        .send({ email: uniqueEmail() })
        .expect(200);
      expect(res.body).toEqual({ sent: true });
    });
  });

  describe('otp', () => {
    it('sends by email and logs in with the code', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);

      await api()
        .post('/api/v1/auth/otp/request')
        .send({ email: body.email, channel: 'email', purpose: 'login' })
        .expect(200);

      expect(sms.sent).toHaveLength(0);
      const code = email.sent[email.sent.length - 1].body.split(' ')[0];

      const res = await api()
        .post('/api/v1/auth/otp/verify')
        .send({ email: body.email, code, purpose: 'login' })
        .expect(200);
      expect(res.body.tokens.accessToken).toBeTruthy();
    });

    it('sends by sms and logs in with the code', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);

      await api()
        .post('/api/v1/auth/otp/request')
        .send({ email: body.email, channel: 'sms', purpose: 'login' })
        .expect(200);

      expect(sms.sent).toHaveLength(1);
      expect(sms.sent[0].to).toBe(body.phone);
      const code = sms.lastCode();

      await api()
        .post('/api/v1/auth/otp/verify')
        .send({ email: body.email, code, purpose: 'login' })
        .expect(200);
    });

    it('stores the code as a bcrypt hash, never in the clear', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);
      await api()
        .post('/api/v1/auth/otp/request')
        .send({ email: body.email, channel: 'sms', purpose: 'login' })
        .expect(200);

      const code = sms.lastCode();
      const row = await moduleRef.get(UsersService)['otpCodes'].findOne({ where: {} });
      if (!row) throw new Error('no otp_codes row was written');
      expect(row.codeHash).not.toBe(code);
      // bcrypt, not a fast digest: a 6-digit code is only ~20 bits.
      expect(row.codeHash.startsWith('$2')).toBe(true);
    });

    it('accepts a code only once', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);
      await api()
        .post('/api/v1/auth/otp/request')
        .send({ email: body.email, channel: 'sms', purpose: 'login' })
        .expect(200);
      const code = sms.lastCode();

      await api()
        .post('/api/v1/auth/otp/verify')
        .send({ email: body.email, code, purpose: 'login' })
        .expect(200);
      await api()
        .post('/api/v1/auth/otp/verify')
        .send({ email: body.email, code, purpose: 'login' })
        .expect(401);
    });

    it('counts wrong attempts and burns the code at the ceiling', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);
      await api()
        .post('/api/v1/auth/otp/request')
        .send({ email: body.email, channel: 'sms', purpose: 'login' })
        .expect(200);

      const correct = sms.lastCode();
      // The real code is discovered by brute force to prove the ceiling holds.
      for (let i = 0; i < 5; i++) {
        await api()
          .post('/api/v1/auth/otp/verify')
          .send({ email: body.email, code: '000000', purpose: 'login' });
      }

      const row = await moduleRef.get(UsersService)['otpCodes'].findOne({ where: {} });
      if (!row) throw new Error('no otp_codes row was written');
      expect(row.attempts).toBe(5);
      expect(row.consumedAt).not.toBeNull();

      // Even the right code now fails: the code was burned.
      await api()
        .post('/api/v1/auth/otp/verify')
        .send({ email: body.email, code: correct, purpose: 'login' })
        .expect(401);
    });

    it('does not disclose whether an address exists', async () => {
      const res = await api()
        .post('/api/v1/auth/otp/request')
        .send({ email: uniqueEmail(), channel: 'sms', purpose: 'login' })
        .expect(200);
      expect(res.body).toEqual({ sent: true });
    });
  });

  describe('refresh rotation', () => {
    it('rotates and revokes the presented token', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password })
        .expect(200);
      const first = login.body.tokens.refreshToken;

      const refreshed = await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: first })
        .expect(200);
      const second = refreshed.body.tokens.refreshToken;

      expect(second).not.toBe(first);
      // Replaying the consumed token must fail.
      await api().post('/api/v1/auth/refresh').send({ refreshToken: first }).expect(401);
      // The new one still works.
      await api().post('/api/v1/auth/refresh').send({ refreshToken: second }).expect(200);
    });

    it('revokes a token on logout', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password })
        .expect(200);

      await api()
        .post('/api/v1/auth/logout')
        .send({ refreshToken: login.body.tokens.refreshToken })
        .expect(200);

      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.body.tokens.refreshToken })
        .expect(401);
    });
  });

  describe('me', () => {
    it('requires a token', async () => {
      await api().get('/api/v1/auth/me').expect(401);
    });

    it('returns the current user for a valid token', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password })
        .expect(200);

      const res = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.tokens.accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(body.email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('refuses a valid token for an account that is still unverified', async () => {
      const body = registerBody();
      const registered = await api().post('/api/v1/auth/register').send(body).expect(201);

      // Registration returns a token pair before the address is confirmed. It
      // must not open any protected route.
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: body.email, password: body.password });
      expect(login.status).toBe(403);

      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${registered.body.tokens.accessToken}`)
        .expect(401);

      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });

  describe('health', () => {
    it('answers without a token and without touching the database', async () => {
      const res = await api().get('/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('backend');
    });
  });

  describe('rate limiting', () => {
    it('fires on repeated registrations', async () => {
      // The register route allows 5 per minute.
      for (let i = 0; i < 5; i++) {
        await api().post('/api/v1/auth/register').send(registerBody()).expect(201);
      }

      const blocked = await api().post('/api/v1/auth/register').send(registerBody());

      expect(blocked.status).toBe(429);
    });

    it('fires on repeated failed logins', async () => {
      const body = registerBody();
      await api().post('/api/v1/auth/register').send(body).expect(201);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: email.lastToken() })
        .expect(200);

      let limited = false;
      for (let i = 0; i < 12; i++) {
        const res = await api()
          .post('/api/v1/auth/login')
          .send({ email: body.email, password: 'wrong-password' });
        if (res.status === 429) {
          limited = true;
          break;
        }
      }
      expect(limited).toBe(true);
    });
  });
});
