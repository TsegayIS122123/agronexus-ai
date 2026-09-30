import { IsEmail, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { OtpChannel, OtpPurpose } from '../../users/otp.enum';

export class VerifyEmailDto {
  @IsString()
  @Length(16, 256, { message: 'token is malformed' })
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @Length(16, 256, { message: 'token is malformed' })
  token: string;

  @IsString()
  @Length(8, 128, { message: 'password must be 8-128 characters' })
  newPassword: string;
}

export class RequestOtpDto {
  @IsEmail()
  email: string;

  @IsIn(Object.values(OtpChannel), { message: 'channel must be email or sms' })
  channel: OtpChannel;

  @IsOptional()
  @IsIn(Object.values(OtpPurpose))
  purpose?: OtpPurpose;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code: string;

  @IsOptional()
  @IsIn(Object.values(OtpPurpose))
  purpose?: OtpPurpose;
}
