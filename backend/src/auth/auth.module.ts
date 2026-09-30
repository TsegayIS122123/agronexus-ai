import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SmsModule } from '../notifications/sms.module';

@Module({
  imports: [
    UsersModule,
    // AuthService resolves both delivery channels through these symbols, so the
    // providing modules must be visible here rather than only in AppModule.
    NotificationsModule,
    SmsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Secret and expiry are supplied per-sign in AuthService, because access and
    // refresh tokens must be signed with different keys.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
