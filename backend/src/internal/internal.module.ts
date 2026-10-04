import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AiServiceClient } from './ai-service.client';
import { InternalTokenService } from './internal-token.service';

/**
 * Backend-to-ai-service plumbing.
 *
 * Kept separate from `AuthModule` on purpose: the internal service token is not
 * a user session and must not be minted by, or exported from, `AuthModule`, so
 * the two can never be confused at an injection site.
 */
@Module({
  imports: [
    // Secret and expiry are supplied per-sign in InternalTokenService, because
    // the internal key must differ from both JWT_SECRET and JWT_REFRESH_SECRET.
    JwtModule.register({}),
  ],
  providers: [InternalTokenService, AiServiceClient],
  exports: [InternalTokenService, AiServiceClient],
})
export class InternalModule {}
