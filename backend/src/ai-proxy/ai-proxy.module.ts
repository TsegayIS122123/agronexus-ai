import { Module } from '@nestjs/common';

import { InternalModule } from '../internal/internal.module';
import { AiProxyController } from './ai-proxy.controller';
import { AiProxyService } from './ai-proxy.service';

/**
 * The single place the browser can reach the AI service.
 *
 * InternalModule exports AiServiceClient, which mints the internal service
 * token per call. This module never touches the JWT signing itself, so the
 * auth surface stays in one module.
 */
@Module({
  imports: [InternalModule],
  controllers: [AiProxyController],
  providers: [AiProxyService],
})
export class AiProxyModule {}
