import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

/**
 * Unauthenticated on purpose and backed by no database call, so a container
 * health check stays meaningful even while Postgres is unreachable.
 */
@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'backend',
      version: '1.0.0',
    };
  }
}
