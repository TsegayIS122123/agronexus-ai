import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

export const TEST_JWT_SECRET = 'test-access-secret-'.padEnd(64, 'a');
export const TEST_REFRESH_SECRET = 'test-refresh-secret-'.padEnd(64, 'b');

/**
 * Applied to every e2e app so the suite exercises the same DTO trust boundary
 * as production: unknown keys are rejected rather than silently ignored.
 */
export function applyGlobalPipes(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

/**
 * Database under test. Must never point at a development database: the suite
 * truncates identity tables between cases.
 */
export function testDatabaseName(): string {
  const name = process.env.TEST_DB_NAME ?? 'agronexus_test';
  if (!name.includes('test')) {
    throw new Error(
      `Refusing to run destructive e2e tests against "${name}". ` +
        'The database name must contain "test".',
    );
  }
  return name;
}
