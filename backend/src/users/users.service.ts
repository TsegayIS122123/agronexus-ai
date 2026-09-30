import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { EmailVerification } from './email-verification.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { OtpCode } from './otp-code.entity';
import { RefreshToken } from './refresh-token.entity';
import { VerificationPurpose } from './verification-purpose.enum';
import { OtpChannel, OtpPurpose } from './otp.enum';
import {
  generateNumericOtp,
  hashToken,
  issueToken,
  IssuedToken,
  NUMERIC_OTP_MAX_ATTEMPTS,
} from './token.util';

const VERIFICATION_TTL_MINUTES = 60 * 24;
const RESET_TTL_MINUTES = 60;
const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
export const BCRYPT_ROUNDS = 12;

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  language?: string;
  region?: string;
}

export interface IssueVerification {
  user: User;
  token: IssuedToken;
  email: string;
}

export interface IssueReset {
  user: User;
  token: IssuedToken;
}

export interface IssueOtp {
  user: User;
  code: string;
  channel: OtpChannel;
  destination: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Data access and token issuance for identity. No HTTP concerns live here, and
 * nothing here reveals whether an account exists unless the caller is already
 * allowed to know.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly verifications: Repository<EmailVerification>,
    @InjectRepository(PasswordResetToken)
    private readonly resets: Repository<PasswordResetToken>,
    @InjectRepository(OtpCode)
    private readonly otpCodes: Repository<OtpCode>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email: email.toLowerCase() },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'passwordHash',
        'language',
        'region',
        'role',
        'isVerified',
        'createdAt',
      ],
    });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async requireById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async emailTaken(email: string): Promise<boolean> {
    const existing = await this.users.findOne({
      where: { email: email.toLowerCase() },
      select: ['id'],
    });
    return existing !== null;
  }

  async phoneTaken(phone: string): Promise<boolean> {
    const existing = await this.users.findOne({ where: { phone }, select: ['id'] });
    return existing !== null;
  }

  async create(input: RegisterInput): Promise<User> {
    const user = this.users.create({
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      language: input.language ?? 'am',
      region: input.region ?? null,
      isVerified: false,
    });
    return this.users.save(user);
  }

  /**
   * Issues a fresh verification token and consumes any earlier outstanding one,
   * so only the most recent link works.
   */
  async issueEmailVerification(user: User): Promise<IssueVerification> {
    await this.verifications
      .createQueryBuilder()
      .update(EmailVerification)
      .set({ consumedAt: new Date() })
      .where('user_id = :userId AND consumed_at IS NULL', { userId: user.id })
      .execute();

    const token = issueToken();
    await this.verifications.save(
      this.verifications.create({
        userId: user.id,
        email: user.email,
        tokenHash: token.hash,
        purpose: VerificationPurpose.VERIFY_EMAIL,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60_000),
        consumedAt: null,
      }),
    );

    return { user, token, email: user.email };
  }

  /**
   * Seconds the caller must wait before another resend is allowed, 0 when allowed.
   */
  async resendCooldownSeconds(userId: string): Promise<number> {
    const last = await this.verifications.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!last) return 0;
    const elapsed = Math.floor((Date.now() - last.createdAt.getTime()) / 1000);
    return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
  }

  /**
   * Consumes a verification token. Returns false for unknown, expired, or
   * already-used tokens — the caller must not distinguish between them.
   */
  async consumeEmailVerification(rawToken: string): Promise<boolean> {
    const record = await this.verifications.findOne({
      where: {
        tokenHash: hashToken(rawToken),
        purpose: VerificationPurpose.VERIFY_EMAIL,
      },
    });
    if (!record) return false;
    if (record.consumedAt !== null) return false;
    if (record.expiresAt.getTime() < Date.now()) return false;

    record.consumedAt = new Date();
    await this.verifications.save(record);

    await this.users.update({ id: record.userId }, { isVerified: true });
    return true;
  }

  async issuePasswordReset(user: User, requestIp?: string): Promise<IssueReset> {
    // Invalidate every outstanding reset so only the newest link is live.
    await this.resets
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ consumedAt: new Date() })
      .where('user_id = :userId AND consumed_at IS NULL', { userId: user.id })
      .execute();

    const token = issueToken();
    await this.resets.save(
      this.resets.create({
        userId: user.id,
        tokenHash: token.hash,
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
        consumedAt: null,
        requestIp: requestIp ?? null,
      }),
    );

    return { user, token };
  }

  /**
   * Applies a password reset and revokes every refresh token for the account, so
   * sessions opened with the old password stop working.
   */
  async consumePasswordReset(rawToken: string, newPassword: string): Promise<boolean> {
    const record = await this.resets.findOne({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!record) return false;
    if (record.consumedAt !== null) return false;
    if (record.expiresAt.getTime() < Date.now()) return false;

    record.consumedAt = new Date();
    await this.resets.save(record);

    await this.users.update(
      { id: record.userId },
      { passwordHash: await hashPassword(newPassword) },
    );
    await this.revokeAllRefreshTokens(record.userId);
    return true;
  }

  async issueOtp(
    user: User,
    channel: OtpChannel,
    purpose: OtpPurpose,
  ): Promise<IssueOtp> {
    const destination = channel === OtpChannel.SMS ? user.phone : user.email;

    // Supersede any outstanding code for the same destination and purpose.
    await this.otpCodes
      .createQueryBuilder()
      .update(OtpCode)
      .set({ consumedAt: new Date() })
      .where(
        'destination = :destination AND purpose = :purpose AND consumed_at IS NULL',
        {
          destination,
          purpose,
        },
      )
      .execute();

    const code = generateNumericOtp();
    await this.otpCodes.save(
      this.otpCodes.create({
        userId: user.id,
        channel,
        destination,
        codeHash: await hashPassword(code),
        purpose,
        attempts: 0,
        maxAttempts: NUMERIC_OTP_MAX_ATTEMPTS,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
        consumedAt: null,
      }),
    );

    return { user, code, channel, destination };
  }

  findLatestOtp(userId: string, purpose: OtpPurpose): Promise<OtpCode | null> {
    return this.otpCodes.findOne({
      where: { userId, purpose, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Verifies a submitted code against the newest outstanding one.
   *
   * bcrypt salts differ per row, so the code cannot be found by digest: the row
   * is located by user and purpose, then the candidate is compared directly.
   * Each wrong guess increments `attempts`; at the ceiling the code is burned so
   * a 6-digit space cannot be walked.
   */
  async verifyOtp(
    userId: string,
    purpose: OtpPurpose,
    rawCode: string,
  ): Promise<boolean> {
    const candidate = await this.findLatestOtp(userId, purpose);
    if (!candidate) return false;
    if (candidate.expiresAt.getTime() < Date.now()) return false;

    if (await verifyPassword(rawCode, candidate.codeHash)) {
      candidate.consumedAt = new Date();
      await this.otpCodes.save(candidate);
      return true;
    }

    candidate.attempts += 1;
    if (candidate.attempts >= candidate.maxAttempts) {
      candidate.consumedAt = new Date();
    }
    await this.otpCodes.save(candidate);
    return false;
  }

  async saveRefreshToken(
    userId: string,
    tokenHash: string,
    ttlDays: number,
    requestIp?: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    return this.refreshTokens.save(
      this.refreshTokens.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
        revokedAt: null,
        replacedById: null,
        requestIp: requestIp ?? null,
        userAgent: userAgent ? userAgent.slice(0, 512) : null,
      }),
    );
  }

  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshTokens.findOne({ where: { tokenHash } });
  }

  async revokeRefreshToken(id: string, replacedById?: string): Promise<void> {
    await this.refreshTokens.update(
      { id },
      { revokedAt: new Date(), replacedById: replacedById ?? null },
    );
  }

  /** Used on password reset, logout-everywhere, and password change. */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokens
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();
  }
}
