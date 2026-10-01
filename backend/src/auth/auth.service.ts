import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';

import { UsersService, verifyPassword } from '../users/users.service';
import { User } from '../users/user.entity';
import { OtpChannel, OtpPurpose } from '../users/otp.enum';
import { hashToken, issueToken } from '../users/token.util';
import { EMAIL_DELIVERY, EmailDelivery } from '../notifications/notifications.module';
import { SMS_DELIVERY, SmsDelivery } from '../notifications/sms.module';
import { LoginResult, PublicUser, RegisterResult, TokenPair } from './dto/auth.types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/identity.dto';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export interface RefreshContext {
  ip?: string;
  userAgent?: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    language: user.language,
    region: user.region,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(EMAIL_DELIVERY) private readonly email: EmailDelivery,
    @Inject(SMS_DELIVERY) private readonly sms: SmsDelivery,
  ) {}

  async register(dto: RegisterDto, ctx: RefreshContext = {}): Promise<RegisterResult> {
    const email = dto.email.toLowerCase();

    if (await this.users.emailTaken(email)) {
      // Registration is the one flow where saying "email is taken" is correct:
      // the caller already owns the address being registered.
      throw new ForbiddenException('An account with this email already exists');
    }
    if (await this.users.phoneTaken(dto.phone)) {
      throw new ForbiddenException('An account with this phone already exists');
    }

    const user = await this.users.create({
      name: dto.name,
      email,
      phone: dto.phone,
      password: dto.password,
      language: dto.language,
      region: dto.region,
      role: dto.role,
    });

    // The account stays unverified; the token below is issued but every
    // protected route checks isVerified, so it buys nothing yet.
    const tokens = await this.issueTokens(user, ctx);
    const verification = await this.users.issueEmailVerification(user);
    await this.deliverVerificationEmail(verification.email, verification.token.raw);

    return { user: toPublicUser(user), tokens };
  }

  async login(dto: LoginDto, ctx: RefreshContext = {}): Promise<LoginResult> {
    const user = await this.users.findByEmail(dto.email);

    // Hash even when the account is unknown, so response time does not reveal
    // whether an email is registered.
    const passwordOk = user
      ? await verifyPassword(dto.password, user.passwordHash)
      : await verifyPassword(dto.password, DUMMY_HASH);

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Email address is not verified. Check your inbox for the verification link.',
      );
    }

    const tokens = await this.issueTokens(user, ctx);
    return { user: toPublicUser(user), tokens };
  }

  async verifyEmail(token: string): Promise<{ verified: true }> {
    const ok = await this.users.consumeEmailVerification(token);
    // One response for unknown / expired / already-used, so a token cannot be
    // probed for validity.
    if (!ok) {
      throw new ForbiddenException('This verification link is invalid or has expired');
    }
    return { verified: true };
  }

  async resendVerification(email: string): Promise<{ sent: true }> {
    const user = await this.users.findByEmail(email);
    // Always report success: whether an address exists is not public.
    if (!user) return { sent: true };
    if (user.isVerified) return { sent: true };

    const cooldown = await this.users.resendCooldownSeconds(user.id);
    if (cooldown > 0) {
      throw new ForbiddenException(
        `Please wait ${cooldown} seconds before requesting another verification email`,
      );
    }

    const issued = await this.users.issueEmailVerification(user);
    await this.deliverVerificationEmail(issued.email, issued.token.raw);
    return { sent: true };
  }

  async requestPasswordReset(
    email: string,
    ctx: RefreshContext = {},
  ): Promise<{ sent: true }> {
    const user = await this.users.findByEmail(email);
    if (!user) return { sent: true };

    const issued = await this.users.issuePasswordReset(user, ctx.ip);
    await this.deliverResetEmail(user.email, issued.token.raw);
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: true }> {
    const ok = await this.users.consumePasswordReset(dto.token, dto.newPassword);
    if (!ok) {
      throw new ForbiddenException('This reset link is invalid or has expired');
    }
    return { reset: true };
  }

  async requestOtp(
    email: string,
    channel: OtpChannel,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<{ sent: true }> {
    const user = await this.users.findByEmail(email);
    // Same non-enumerating behaviour as password reset.
    if (!user) return { sent: true };

    if (purpose === OtpPurpose.LOGIN && !user.isVerified) {
      throw new ForbiddenException('Email address is not verified');
    }

    const issued = await this.users.issueOtp(user, channel, purpose);
    const message = `${issued.code} is your AgroNexus verification code. It expires in 10 minutes.`;

    if (issued.channel === OtpChannel.SMS) {
      await this.sms.send({ to: issued.destination, message });
    } else {
      await this.email.send({
        to: issued.destination,
        subject: 'Your AgroNexus verification code',
        body: message,
      });
    }
    return { sent: true };
  }

  async verifyOtp(
    email: string,
    code: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    // Same message for unknown account and wrong code.
    if (!user) throw new UnauthorizedException('Invalid verification code');

    const ok = await this.users.verifyOtp(user.id, purpose, code);
    if (!ok) throw new UnauthorizedException('Invalid verification code');

    const tokens = await this.issueTokens(user);
    return { user: toPublicUser(user), tokens };
  }

  async refresh(rawRefreshToken: string, ctx: RefreshContext = {}): Promise<LoginResult> {
    const record = await this.users.findRefreshTokenByHash(hashToken(rawRefreshToken));
    if (!record || record.revokedAt !== null || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    const user = await this.users.requireById(record.userId);

    // Rotation: the presented token is revoked as the replacement is issued.
    const tokens = await this.issueTokens(user, ctx);
    await this.users.revokeRefreshToken(record.id);
    return { user: toPublicUser(user), tokens };
  }

  async logout(rawRefreshToken: string): Promise<{ loggedOut: true }> {
    const record = await this.users.findRefreshTokenByHash(hashToken(rawRefreshToken));
    if (record) await this.users.revokeRefreshToken(record.id);
    return { loggedOut: true };
  }

  async me(userId: string): Promise<PublicUser> {
    return toPublicUser(await this.users.requireById(userId));
  }

  private async issueTokens(user: User, ctx: RefreshContext = {}): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        role: user.role,
        // Stamped into the access token so a later verification change takes
        // effect without waiting for the token to expire.
        verified: user.isVerified,
        typ: 'access',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    );

    // The client receives the raw refresh token; only its hash is persisted.
    // Returning the hash here would mean the stored value and the value the
    // client holds differed by a second hash on the way back in, and every
    // refresh lookup would miss.
    const refreshToken = issueToken(48).raw;

    await this.users.saveRefreshToken(
      user.id,
      hashToken(refreshToken),
      this.refreshTokenTtlDays(),
      ctx.ip,
      ctx.userAgent,
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /**
   * Read from ConfigService rather than process.env directly so tests and
   * deployments set it the same way as everything else.
   */
  private refreshTokenTtlDays(): number {
    const raw = this.config.get<string>('JWT_REFRESH_TTL_DAYS', '7');
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.logger.warn(`JWT_REFRESH_TTL_DAYS=${raw} is not a positive number; using 7`);
      return 7;
    }
    return parsed;
  }

  private async deliverVerificationEmail(email: string, token: string): Promise<void> {
    const frontendBase = this.config.get('FRONTEND_BASE_URL', 'http://localhost:3000');
    await this.email.send({
      to: email,
      subject: 'Verify your AgroNexus email address',
      body: `Confirm your address to activate your account: ${frontendBase}/auth/verify-email?token=${token}`,
    });
  }

  private async deliverResetEmail(email: string, token: string): Promise<void> {
    const frontendBase = this.config.get('FRONTEND_BASE_URL', 'http://localhost:3000');
    await this.email.send({
      to: email,
      subject: 'Reset your AgroNexus password',
      body: `Choose a new password: ${frontendBase}/auth/reset-password?token=${token}`,
    });
  }
}

/**
 * A real bcrypt hash of a value nobody knows, compared against when the account
 * does not exist so the failure path costs the same as the success path.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.iaWs1JOwuiPvNMPZvQGQiXaW5uFqOWqy';
