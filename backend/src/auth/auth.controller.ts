import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import {
  RequestOtpDto,
  RequestPasswordResetDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyOtpDto,
} from './dto/identity.dto';
import { OtpPurpose } from '../users/otp.enum';
import { CurrentUser, Public } from './public.decorator';
import { PublicUser } from './dto/auth.types';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Registration is deliberately the most rate-limited endpoint here: each call
   * can create an account and trigger an outbound email.
   */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Req() req: Request, @Body() dto: RegisterDto) {
    return this.auth.register(dto, contextFrom(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.auth.login(dto, contextFrom(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Public()
  @Post('request-password-reset')
  @HttpCode(200)
  requestPasswordReset(@Req() req: Request, @Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto.email, contextFrom(req));
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Public()
  @Post('otp/request')
  @HttpCode(200)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.email, dto.channel, dto.purpose ?? OtpPurpose.LOGIN);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.email, dto.code, dto.purpose ?? OtpPurpose.LOGIN);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() req: Request, @Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken, contextFrom(req));
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: { userId: string }): Promise<PublicUser> {
    return this.auth.me(user.userId);
  }
}

function contextFrom(req: Request): { ip?: string; userAgent?: string } {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
