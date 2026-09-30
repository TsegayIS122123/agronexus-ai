import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { EmailVerification } from './email-verification.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { OtpCode } from './otp-code.entity';
import { RefreshToken } from './refresh-token.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EmailVerification,
      PasswordResetToken,
      OtpCode,
      RefreshToken,
    ]),
  ],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
