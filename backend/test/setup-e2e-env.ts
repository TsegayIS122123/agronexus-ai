import { testDatabaseName } from './test-helpers';

/**
 * Runs before the test file is imported, and therefore before AppModule is
 * evaluated.
 *
 * This ordering matters: `ConfigModule.forRoot({ validate })` reads the
 * environment while the module decorator is being evaluated and then writes the
 * validated snapshot back into `process.env`. Anything assigned inside a
 * `beforeAll` hook arrives too late, so the suite would silently connect to the
 * developer database from `backend/.env` and truncate real rows.
 */
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5436';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_NAME = testDatabaseName();

process.env.JWT_SECRET = 'test-access-secret-'.padEnd(64, 'a');
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-'.padEnd(64, 'b');
process.env.JWT_REFRESH_TTL_DAYS = '7';
// Distinct from both JWT secrets, which validateEnv enforces. Without this the
// e2e suite would exercise the "not configured" path rather than the real one.
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret-'.padEnd(64, 'c');
process.env.NODE_ENV = 'test';
