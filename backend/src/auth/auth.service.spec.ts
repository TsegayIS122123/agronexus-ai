import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OtpChannel, OtpPurpose } from '../users/otp.enum';
import { UserRole } from '../users/user-role.enum';
import { hashToken } from '../users/token.util';
import { EmailDelivery, EMAIL_DELIVERY } from '../notifications/notifications.module';
import { SmsDelivery, SMS_DELIVERY } from '../notifications/sms.module';

/**
 * Captures what would have been sent so the tests can assert on delivery
 * without a real provider, and so tokens can be read back the way a user would.
 */
class FakeEmail implements EmailDelivery {
  sent: { to: string; subject: string; body: string }[] = [];
  async send(input: { to: string; subject: string; body: string }) {
    this.sent.push(input);
  }
  lastToken(): string {
    const body = this.sent[this.sent.length - 1].body;
    return body.slice(body.lastIndexOf('token=') + 6);
  }
}

class FakeSms implements SmsDelivery {
  sent: { to: string; message: string }[] = [];
  async send(input: { to: string; message: string }) {
    this.sent.push(input);
  }
  lastCode(): string {
    return this.sent[this.sent.length - 1].message.split(' ')[0];
  }
}

const ACCESS_SECRET = 'a'.repeat(64);
const REFRESH_SECRET = 'b'.repeat(64);

/** The stored refresh-token row, as far as AuthService inspects it. */
type FakeRefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  requestIp: string | null;
  userAgent: string | null;
  createdAt: Date;
};

function makeRefreshToken(overrides: Partial<FakeRefreshToken> = {}): FakeRefreshToken {
  return {
    id: 't1',
    userId: makeUser().id,
    tokenHash: 'h'.repeat(64),
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    replacedById: null,
    requestIp: null,
    userAgent: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/** A stand-in for the User row. Structurally complete for what AuthService reads. */
type FakeUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  language: string | null;
  region: string | null;
  role: UserRole | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function makeUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test User',
    email: 'user@example.com',
    phone: '+251911000000',
    passwordHash: bcrypt.hashSync('correct-horse', 4),
    language: 'en',
    region: null,
    role: UserRole.FARMER,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  // jest.Mocked<Partial<T>> leaves the methods as plain function types, so the
  // mock type is spelled out explicitly instead.
  let users: jest.Mocked<
    Pick<
      UsersService,
      | 'findByEmail'
      | 'findById'
      | 'emailTaken'
      | 'phoneTaken'
      | 'create'
      | 'issueEmailVerification'
      | 'resendCooldownSeconds'
      | 'consumeEmailVerification'
      | 'issuePasswordReset'
      | 'consumePasswordReset'
      | 'issueOtp'
      | 'verifyOtp'
      | 'saveRefreshToken'
      | 'findRefreshTokenByHash'
      | 'revokeRefreshToken'
      | 'revokeAllRefreshTokens'
      | 'requireById'
    >
  >;
  let email: FakeEmail;
  let sms: FakeSms;
  let jwt: JwtService;

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      emailTaken: jest.fn().mockResolvedValue(false),
      phoneTaken: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
      issueEmailVerification: jest.fn(),
      resendCooldownSeconds: jest.fn().mockResolvedValue(0),
      consumeEmailVerification: jest.fn(),
      issuePasswordReset: jest.fn(),
      consumePasswordReset: jest.fn(),
      issueOtp: jest.fn(),
      verifyOtp: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshTokenByHash: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokens: jest.fn(),
      requireById: jest.fn(),
    };

    email = new FakeEmail();
    sms = new FakeSms();
    jwt = new JwtService({});

    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: ACCESS_SECRET,
          JWT_REFRESH_SECRET: REFRESH_SECRET,
          FRONTEND_BASE_URL: 'http://localhost:3000',
        };
        return map[key] ?? fallback;
      }),
      getOrThrow: jest.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: ACCESS_SECRET,
          JWT_REFRESH_SECRET: REFRESH_SECRET,
        };
        if (!map[key]) throw new Error(`missing ${key}`);
        return map[key];
      }),
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: ConfigService, useValue: config },
        { provide: JwtService, useValue: jwt },
        { provide: EMAIL_DELIVERY, useValue: email },
        { provide: SMS_DELIVERY, useValue: sms },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates the account unverified and sends a verification link', async () => {
      const created = makeUser({ isVerified: false });
      users.create!.mockResolvedValue(created);
      users.issueEmailVerification!.mockResolvedValue({
        user: created,
        token: { raw: 'v'.repeat(64), hash: 'h'.repeat(64) },
        email: created.email,
      });

      const result = await service.register({
        name: 'Test User',
        email: 'User@Example.com',
        phone: '+251911000000',
        password: 'correct-horse',
      });

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com' }),
      );
      expect(result.user.isVerified).toBe(false);
      expect(email.sent).toHaveLength(1);
      expect(email.sent[0].body).toContain('v'.repeat(64));
    });

    it('rejects a duplicate email', async () => {
      users.emailTaken!.mockResolvedValue(true);
      await expect(
        service.register({
          name: 'A',
          email: 'dupe@example.com',
          phone: '+251911000000',
          password: 'correct-horse',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a duplicate phone', async () => {
      users.phoneTaken!.mockResolvedValue(true);
      await expect(
        service.register({
          name: 'A',
          email: 'a@example.com',
          phone: '+251911111111',
          password: 'correct-horse',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('login', () => {
    it('refuses an unverified account with a distinct, actionable error', async () => {
      users.findByEmail!.mockResolvedValue(makeUser({ isVerified: false }));

      await expect(
        service.login({ email: 'user@example.com', password: 'correct-horse' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns the same error for a wrong password and an unknown account', async () => {
      users.findByEmail!.mockResolvedValue(makeUser());
      const wrongPassword = await service
        .login({ email: 'user@example.com', password: 'nope' })
        .catch((e) => e.message);

      users.findByEmail!.mockResolvedValue(null);
      const unknownUser = await service
        .login({ email: 'ghost@example.com', password: 'nope' })
        .catch((e) => e.message);

      expect(wrongPassword).toBe(unknownUser);
    });

    it('issues a token pair for a verified account', async () => {
      users.findByEmail!.mockResolvedValue(makeUser());
      const result = await service.login({
        email: 'user@example.com',
        password: 'correct-horse',
      });

      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      // The raw token is what the client holds; the persisted value is its hash
      // and must not be the same string. The third argument is the refresh TTL
      // in days, which falls back to 7 when JWT_REFRESH_TTL_DAYS is unset - as
      // it is in this config mock.
      expect(users.saveRefreshToken).toHaveBeenCalledWith(
        result.user.id,
        hashToken(result.tokens.refreshToken),
        7,
        undefined,
        undefined,
      );
      const [, stored] = users.saveRefreshToken.mock.calls[0];
      expect(stored).not.toBe(result.tokens.refreshToken);
      expect(stored).toHaveLength(64);
    });
  });

  describe('verifyEmail', () => {
    it('rejects a token the service cannot consume', async () => {
      users.consumeEmailVerification!.mockResolvedValue(false);
      await expect(service.verifyEmail('x'.repeat(64))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('accepts a consumable token', async () => {
      users.consumeEmailVerification!.mockResolvedValue(true);
      await expect(service.verifyEmail('x'.repeat(64))).resolves.toEqual({
        verified: true,
      });
    });
  });

  describe('resendVerification', () => {
    it('reports success for an unknown address so accounts cannot be enumerated', async () => {
      users.findByEmail!.mockResolvedValue(null);
      await expect(service.resendVerification('ghost@example.com')).resolves.toEqual({
        sent: true,
      });
      expect(email.sent).toHaveLength(0);
    });

    it('enforces the resend cooldown', async () => {
      users.findByEmail!.mockResolvedValue(makeUser({ isVerified: false }));
      users.resendCooldownSeconds!.mockResolvedValue(42);

      await expect(service.resendVerification('user@example.com')).rejects.toThrow(
        /42 seconds/,
      );
    });

    it('sends a new link when no cooldown is active', async () => {
      const user = makeUser({ isVerified: false });
      users.findByEmail!.mockResolvedValue(user);
      users.issueEmailVerification!.mockResolvedValue({
        user,
        token: { raw: 'n'.repeat(64), hash: 'h2'.repeat(32) },
        email: user.email,
      });

      await expect(service.resendVerification(user.email)).resolves.toEqual({
        sent: true,
      });
      expect(email.sent).toHaveLength(1);
    });
  });

  describe('password reset', () => {
    it('reports success even when the address is unknown', async () => {
      users.findByEmail!.mockResolvedValue(null);
      await expect(service.requestPasswordReset('ghost@example.com')).resolves.toEqual({
        sent: true,
      });
    });

    it('revokes refresh tokens when the password is actually changed', async () => {
      users.consumePasswordReset!.mockResolvedValue(true);
      await service.resetPassword({
        token: 'x'.repeat(64),
        newPassword: 'brand-new-password',
      });
      // Revocation happens inside UsersService; the service only reports success.
      expect(users.consumePasswordReset).toHaveBeenCalledWith(
        'x'.repeat(64),
        'brand-new-password',
      );
    });

    it('rejects an invalid reset token', async () => {
      users.consumePasswordReset!.mockResolvedValue(false);
      await expect(
        service.resetPassword({ token: 'x'.repeat(64), newPassword: 'new-password' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('otp', () => {
    it('sends by SMS when the SMS channel is chosen', async () => {
      const user = makeUser();
      users.findByEmail!.mockResolvedValue(user);
      users.issueOtp!.mockResolvedValue({
        user,
        code: '123456',
        channel: OtpChannel.SMS,
        destination: user.phone,
      });

      await service.requestOtp(user.email, OtpChannel.SMS);

      expect(sms.sent).toHaveLength(1);
      expect(sms.sent[0].to).toBe(user.phone);
      expect(email.sent).toHaveLength(0);
    });

    it('sends by email when the email channel is chosen', async () => {
      const user = makeUser();
      users.findByEmail!.mockResolvedValue(user);
      users.issueOtp!.mockResolvedValue({
        user,
        code: '654321',
        channel: OtpChannel.EMAIL,
        destination: user.email,
      });

      await service.requestOtp(user.email, OtpChannel.EMAIL);

      expect(email.sent).toHaveLength(1);
      expect(sms.sent).toHaveLength(0);
    });

    it('does not disclose whether an address exists', async () => {
      users.findByEmail!.mockResolvedValue(null);
      await expect(
        service.requestOtp('ghost@example.com', OtpChannel.SMS),
      ).resolves.toEqual({ sent: true });
    });

    it('issues tokens after a correct code', async () => {
      users.findByEmail!.mockResolvedValue(makeUser());
      users.verifyOtp!.mockResolvedValue(true);

      const result = await service.verifyOtp('user@example.com', '123456');
      expect(users.verifyOtp).toHaveBeenCalledWith(
        expect.any(String),
        OtpPurpose.LOGIN,
        '123456',
      );
      expect(result.tokens.accessToken).toBeTruthy();
    });

    it('gives the same error for a wrong code and an unknown account', async () => {
      users.findByEmail!.mockResolvedValue(makeUser());
      users.verifyOtp!.mockResolvedValue(false);
      const wrong = await service
        .verifyOtp('user@example.com', '000000')
        .catch((e) => e.message);

      users.findByEmail!.mockResolvedValue(null);
      const unknown = await service
        .verifyOtp('ghost@example.com', '000000')
        .catch((e) => e.message);

      expect(wrong).toBe(unknown);
      expect(wrong).toBe('Invalid verification code');
    });
  });

  describe('refresh rotation', () => {
    it('rejects an unknown refresh token', async () => {
      users.findRefreshTokenByHash!.mockResolvedValue(null);
      await expect(service.refresh('r'.repeat(64))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an already-revoked token', async () => {
      users.findRefreshTokenByHash!.mockResolvedValue(
        makeRefreshToken({
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 100_000),
        }),
      );
      await expect(service.refresh('r'.repeat(64))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('revokes the presented token when rotating', async () => {
      const user = makeUser();
      users.findRefreshTokenByHash!.mockResolvedValue(
        makeRefreshToken({ userId: user.id }),
      );
      users.requireById!.mockResolvedValue(user);

      await service.refresh('r'.repeat(64));
      expect(users.revokeRefreshToken).toHaveBeenCalledWith('t1');
    });
  });
});
