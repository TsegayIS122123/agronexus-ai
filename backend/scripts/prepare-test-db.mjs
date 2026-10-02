/**
 * Creates the e2e test database if it is missing, then brings it to the Alembic
 * head revision.
 *
 * The NestJS service runs with `synchronize: false` because ai-service owns the
 * schema through Alembic. That means a fresh Docker volume has no test schema at
 * all, and the suite fails with "relation email_verifications does not exist"
 * before a single assertion runs. Rebuilding the backend cannot help: compiling
 * TypeScript never touches the database.
 *
 * Run via `npm run test:e2e`, which calls this first through the pretest hook.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

// Mirrors backend/.env and test/setup-e2e-env.ts. The e2e suite hard-codes the
// same values, so they are read from one place here rather than duplicated.
const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = Number.parseInt(process.env.DB_PORT ?? '5436', 10);
const DB_USER = process.env.DB_USER ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
const DB_NAME = process.env.TEST_DB_NAME ?? 'agronexus_test';

// The suite truncates identity tables between cases, so it must never be pointed
// at a development database. Same guard as test-helpers.ts.
if (!DB_NAME.includes('test')) {
  console.error(
    `Refusing to prepare "${DB_NAME}": the e2e test database name must contain "test".`,
  );
  process.exit(1);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pythonBin = process.platform === 'win32'
  ? path.join(repoRoot, '.venv', 'Scripts', 'python.exe')
  : path.join(repoRoot, '.venv', 'bin', 'python');

const databaseUrl =
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

async function ensureDatabaseExists() {
  const admin = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    // `postgres` always exists, so it is safe to connect to on a fresh volume.
    database: 'postgres',
  });

  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'select 1 from pg_database where datname = $1',
      [DB_NAME],
    );
    if (rowCount === 0) {
      // CREATE DATABASE cannot be parameterised, so the identifier is quoted.
      // The name is validated above to contain "test".
      await admin.query(`create database "${DB_NAME}"`);
      console.log(`created database ${DB_NAME}`);
    }
  } finally {
    await admin.end();
  }
}

function runAlembicUpgrade() {
  const result = spawnSync(pythonBin, ['-m', 'alembic', 'upgrade', 'head'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
    shell: false,
  });

  if (result.error) {
    console.error(
      `Could not run ${pythonBin}. Activate the repository .venv, or create it with ` +
        'python -m venv .venv and pip install -r requirements-dev.txt.',
    );
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(
      `Alembic failed to migrate ${DB_NAME} (exit code ${result.status}). ` +
        'Is Postgres running on port ' +
        `${DB_PORT}? Try: docker compose up -d postgres`,
    );
    process.exit(result.status ?? 1);
  }
}

try {
  await ensureDatabaseExists();
  runAlembicUpgrade();
  console.log(`test database ${DB_NAME} is at the Alembic head revision`);
} catch (error) {
  console.error(
    `Could not reach Postgres at ${DB_HOST}:${DB_PORT}. ` +
      'Try: docker compose up -d postgres',
  );
  console.error(error.message);
  process.exit(1);
}
