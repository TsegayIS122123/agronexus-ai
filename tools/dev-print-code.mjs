/**
 * Prints a working verification or OTP code for a local account, and plants the
 * matching hash in the database so the real service accepts it.
 *
 * Why this exists: nothing can read the codes back out of the database. A
 * verification token is stored as SHA-256 and an OTP as bcrypt, both one-way, so
 * `select` cannot recover them and no amount of querying will surface a code that
 * was already sent. Until the service has a real email or SMS provider, the only
 * way to exercise a verification screen locally is to start from a code you chose
 * and store its hash yourself. That is what this does, through the same table the
 * service writes to.
 *
 * It does not weaken anything, because it is not a shortcut around a check. The
 * service still hashes, still compares, still enforces expiry and single use: the
 * code printed here goes through exactly the same verification path a delivered
 * one would. The only thing being skipped is the delivery step, which is the step
 * that has no local implementation yet.
 *
 * Refuses to run outside a local database. See the guard below.
 *
 * Usage, from the repository root:
 *   node tools/dev-print-code.mjs tsegayassefa27@gmail.com
 *   node tools/dev-print-code.mjs tsegayassefa27@gmail.com --otp
 *   node tools/dev-print-code.mjs tsegayassefa27@gmail.com --otp --purpose verify_email
 *   node tools/dev-print-code.mjs +251979416992 --otp
 */

import { createHash, randomBytes, randomInt } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The service's own dependencies, so this tool cannot drift from how the service
// hashes. Resolved out of backend/node_modules without adding a package here.
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "backend", "package.json"));
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);

const connection = {
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5436),
  user: process.env.PGUSER ?? "postgres",
  password: process.env.PGPASSWORD ?? "postgres",
  database: process.env.PGDATABASE ?? "agronexus",
};

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run with NODE_ENV=production.");
  process.exit(1);
}

if (!LOCAL_HOSTS.has(connection.host)) {
  console.error(
    `Refusing to write to a database at ${connection.host}. This tool plants ` +
      "codes by hand; pointing it at a shared or real database would mint a valid\n" +
      "credential for an account without going through the service. Set PGHOST to a\n" +
      "local address if that is genuinely what you meant.",
  );
  process.exit(1);
}

const target = process.argv[2];
const wantOtp = process.argv.includes("--otp");

/**
 * The OTP lookup is by user and purpose, so a code planted under the wrong purpose
 * is invisible to the route that tries to check it and the answer is a bare 401.
 * `login` is the service's own default, so that is the default here too; pass
 * `--purpose` to match a screen that sends one.
 */
const PURPOSES = ["login", "verify_email", "verify_phone", "reset_password"];
const purposeIndex = process.argv.indexOf("--purpose");
const purpose = purposeIndex === -1 ? "login" : process.argv[purposeIndex + 1];

if (!PURPOSES.includes(purpose)) {
  console.error(`--purpose must be one of: ${PURPOSES.join(", ")}`);
  process.exit(1);
}

if (!target) {
  console.error("Usage: node tools/dev-print-code.mjs <email-or-phone> [--otp] [--purpose <purpose>]");
  process.exit(1);
}

const pool = new Pool(connection);

try {
  const { rows } = await pool.query(
    "select id, email, phone, is_verified from users where email = $1 or phone = $1",
    [target],
  );

  if (rows.length === 0) {
    console.error(`No account matches ${target}.`);
    console.error("Register one first, or check the spelling: it has to match exactly.");
    process.exit(1);
  }

  const user = rows[0];
  // Long enough for the DTO's @Length(16, 256) and unguessable, matching the
  // service's own 48-character issueToken(48).
  const token = randomBytes(24).toString("hex");

  if (wantOtp) {
    const code = String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    const channel = target.includes("@") ? "email" : "sms";

    await pool.query(
      `insert into otp_codes (user_id, channel, destination, code_hash, purpose, expires_at)
       values ($1, $2, $3, $4, $5, now() + interval '10 minutes')`,
      [user.id, channel, target, codeHash, purpose],
    );

    console.log(`\n  OTP for ${user.email} (${channel}, purpose: ${purpose})\n`);
    console.log(`    ${code}\n`);
    console.log("  Valid for 10 minutes, single use, up to 5 attempts.");
    if (purpose !== "login") {
      console.log(`\n  The route defaults to purpose 'login', so send it as:`);
      console.log(`    { "email": "${user.email}", "code": "${code}", "purpose": "${purpose}" }`);
    }
  } else {
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await pool.query(
      `insert into email_verifications (user_id, email, token_hash, purpose, expires_at)
       values ($1, $2, $3, 'verify_email', now() + interval '2 hours')`,
      [user.id, user.email, tokenHash],
    );

    console.log(`\n  Verification token for ${user.email}\n`);
    console.log(`    ${token}\n`);
    console.log("  Valid for 2 hours, single use.");
    if (user.is_verified) {
      console.log("\n  This account is already verified. To exercise the screen again, clear it first:");
      console.log(
        `    docker exec agronexus-postgres psql -U postgres -d ${connection.database} ` +
          `-c "update users set is_verified = false where email = '${user.email}';"`,
      );
    }
  }

  console.log("\n  Paste it into /auth/verify-email. The 'Enter the code myself' link");
  console.log("  on the sign-in screen goes to the same page.\n");
} catch (error) {
  console.error(`Failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
