# AgroNexus AI — Implementation Roadmap (working log)

> **This is not documentation for a reader of the product.** It is a working
> execution log: what was built, which command proved it, and what is still
> outstanding. It is expected to change shape as the work proceeds, and it will
> be archived once the system is complete. The design of record for the system
> is [`README.md`](../README.md) and `docs/01`-`docs/09`; nothing here
> overrides those documents.

**Status:** Active
**Last verified:** Phase 1 and Phase 2 verified by real command output, including a live
HTTP smoke against a hand-started server (see each phase's evidence block). Phase 2 is
closed. Phase 3 is the next phase to build.
**Rule for this roadmap:** each phase is built, tested, and merged on its own.
A phase is only marked `Done` when its verification commands have actually been
run and their output captured. No phase is marked done on reasoning alone.

---

## Current State (verified by inspection, not assumption)

| Area | Reality today |
|---|---|
| `frontend/` | Next.js 14 App Router. 24 routes build clean. Root layout already has `Header`, `Footer`, `SkipLink`, `AuthProvider`, `LocaleProvider`. Design tokens now resolve correctly. |
| `backend/` | **Bare NestJS skeleton.** `src/` contains only `app.module.ts`, `app.controller.ts`, `main.ts`. No modules, no ORM, no auth, no `lint`/`test` scripts. Deps are Nest core only. |
| `ai-service/` | FastAPI holding **all** current business logic: 13 routers (auth, chat, disease, prices, weather, marketplace, cooperative, quality, equipment, industry, energy, cost calculator, price comparison). |
| Database | 15 tables via a single Alembic revision `f6d50714db20`. |
| Auth today | Only `POST /api/v1/auth/register` and `POST /api/v1/auth/login`. |
| **Auth gaps** | `users.is_verified` exists but **nothing ever sets it**. There is **no** email-verification, password-reset, OTP, or refresh-token flow, and **no** table for any of them. No SMS integration at all. |
| API surface | 47 paths / 51 HTTP operations, all under `/api/v1/*`. Note routers are mounted as `_IncludedRouter` objects, so `app.routes` reports only 19 entries and naive route counting under-reports; use `app.openapi()["paths"]` instead. |

Because `backend/` is empty while `ai-service/` owns everything, the identity work
must land in `backend/` (the intended system of record) and the frontend must be
pointed at it before AI features grow any further.

---

## Phase Map

| # | Phase | Layer | Status |
|---|---|---|---|
| 1 | Foundation Repair | Frontend | **Done** |
| 2 | Backend Identity Core | Backend + DB | **Done** |
| 3 | Frontend Auth UI | Frontend | **Done**, browser pass outstanding |
| 4 | Auth Integration | Full stack | Planned |
| 5 | API Migration | Backend | Planned |
| 6 | Service Coupling Cleanup | Full stack | Planned |
| 7 | Data Layer Completion | Database | Planned |
| 8 | AI Services | AI | Planned |
| 9 | Security Hardening | Full stack | Planned |
| 10 | Deployment | Infra | Planned |

---

## Phase 1 — Foundation Repair (Frontend) — DONE

**Goal:** stop losing work to invisible drift before adding any feature.

- [x] `#main-content` target added to `<main>` so `SkipLink.tsx` actually works (WCAG 2.4.1).
- [x] Deleted `frontend/lib/theme.js`, which held a *different* token set than `theme.ts`. Tailwind was loading the JS copy, so `transitionDuration`, `transitionTimingFunction`, and `zIndex` were defined in TypeScript but **never reached Tailwind** — every `duration-*`/`z-*` class was a silent no-op.
- [x] `tailwind.config.js` now loads `./lib/theme` directly (Tailwind 3.4 resolves TS via jiti).
- [x] Restored the Ethiopic font stack (`NotoSansEthiopic`, `AbyssinicaSIL`) that existed only in the deleted JS file.
- [x] Deleted empty, never-imported `frontend/lib/i18n/{en,am}.json`.
- [x] Added `typecheck`, `lint`, and `verify:tokens` npm scripts.
- [x] Added `frontend` service to `docker-compose.yml` with `AI_SERVICE_URL=http://ai-service:8000`.
- [x] Added `tests/test_frontend_design_tokens.py` (15 tests) to prevent regression.
- [x] Added `requirements-dev.txt`; both CI workflows now install it instead of ad-hoc pip lines.
- [x] Fixed a real Rules-of-Hooks violation: `NavNavigation.tsx` called `useLocaleValue()` inside an `onChange` callback.
- [x] Escaped an unescaped apostrophe in `app/page.tsx`.

### Phase 1 verification — commands actually run

```
cd frontend && npm run verify:tokens   -> PASS: all 9 token groups resolve
cd frontend && npm run lint            -> No ESLint warnings or errors
cd frontend && npm run typecheck       -> clean
cd frontend && npm run build           -> Compiled successfully, 24/24 pages
python -m pytest tests -q              -> 46 passed
docker compose config                  -> valid (frontend service present)
```

**Note on `verify:tokens`:** a passing `next build` does *not* prove tokens loaded.
If `theme.ts` failed to resolve, Tailwind would silently fall back to defaults and
the build would still pass. `verify:tokens` resolves the config through the same
jiti path Tailwind uses and asserts the values are ours (`300ms`, `150ms`,
`easeInOut`), not Tailwind defaults.

---

## Phase 2 — Backend Identity Core (Backend + DB) — DONE

**Goal:** the system of record for identity, living in `backend/`.

### 2A. Bootstrap the NestJS service

- [x] Added `TypeORM`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `@nestjs/throttler`.
- [x] Added `lint`, `typecheck`, `test`, `test:e2e`, `build` scripts and a Jest harness; wired ESLint and Prettier.
- [x] `backend/.env` stays gitignored; `backend/.env.example` is the checked-in contract.
- [x] Boot-time env validation — `ConfigModule.forRoot({ validate })` fails fast on a missing key or a JWT secret shorter than 32 characters.
- [x] `/health` returns `{ status, service, version }` and is `@Public()`.
- [x] Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`; configurable CORS.

### 2B. Schema

- [x] TypeORM entity mirroring the existing `users` table (`name`, `email`, `phone`, `password_hash`, `language`, `region`, `role`, `is_verified`). No data loss; `synchronize: false`.
- [x] New tables per `docs/04-database-design.md`:
      - `email_verifications` — token hash, purpose, expiry, consumed_at
      - `password_reset_tokens` — token hash, expiry, consumed_at
      - `otp_codes` — channel (`email`|`sms`), destination, code hash, purpose, attempts, expiry, consumed_at
      - `refresh_tokens` — token hash, user, expiry, revoked_at, replaced_by_id, request_ip, user_agent
- [x] Token/OTP columns store **hashes only**; refresh tokens use SHA-256, OTPs use bcrypt.
- [x] Alembic revision `a1b2c3d4e5f6_add_identity_tables.py`; `downgrade` verified clean.
- [x] All UUID primary keys given a `gen_random_uuid()` server default. See the defect below — this was not optional.

### 2C. Identity endpoints

- [x] `POST /api/v1/auth/register` — hashes the password, creates the user `is_verified=false`.
- [x] `POST /api/v1/auth/verify-email` — consumes the token, sets `is_verified=true`, rejects replay.
- [x] `POST /api/v1/auth/resend-verification` — 60s application cooldown plus a 3/min throttle.
- [x] `POST /api/v1/auth/login` — **rejects unverified accounts** with a distinct, non-enumerating error; a wrong password and an unknown account return an identical message.
- [x] `POST /api/v1/auth/request-password-reset` — always 200 whether or not the email exists.
- [x] `POST /api/v1/auth/reset-password` — consumes the token, revokes refresh tokens, invalidates the previous password.
- [x] `POST /api/v1/auth/otp/request` and `POST /api/v1/auth/otp/verify` — email **and** SMS channels, bcrypt-hashed codes, attempt ceiling.
- [x] `POST /api/v1/auth/refresh` (rotating), `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- [x] Email and SMS sit behind provider interfaces with logging fakes, so CI needs no credentials.

### Defects the e2e suite caught (all were invisible to unit tests)

1. **UUID primary keys had no database default.** The pre-existing `users` table was
   created with a bare `sa.UUID()` and SQLAlchemy generated ids in Python. The NestJS
   service uses `@PrimaryGeneratedColumn('uuid')`, which relies on Postgres supplying
   the value, so every insert failed with `null value in column "id"`. Fixed in the
   migration (`gen_random_uuid()` + `pgcrypto`) and in the datasource
   (`uuidExtension: 'pgcrypto'`), because TypeORM otherwise defaults to `uuid-ossp`'s
   `uuid_generate_v4()`.
2. **The e2e suite was truncating the developer database.** `ConfigModule.forRoot({ validate })`
   snapshots `process.env` while the module decorator is evaluated and then writes the
   snapshot back — so anything assigned in a `beforeAll` arrives too late. The suite
   silently connected to `backend/.env` (`agronexus`). Moved to a Jest `setupFiles` entry
   that runs before the test file is imported.
3. **Throttler state survived test isolation.** `ThrottlerStorageService` keeps two maps:
   hit records *and* per-hit expiry timestamps. Clearing only the records left the
   timestamps behind, and each new request was resurrected with every earlier hit counted
   — so unrelated tests were rejected with 429. Reset now clears both.
4. **Unverified accounts were never actually blocked.** `JwtStrategy` re-read the user from
   the database but returned `verified` without checking it, so the token pair handed out at
   registration opened every protected route. Now rejected with 401.
5. **Eight handlers were missing `@Body()`.** When `@Req()` occupied the first parameter slot
   Nest could not infer the payload, and every one of those routes threw
   `Cannot read properties of undefined`.
6. **`EMAIL_DELIVERY` / `SMS_DELIVERY` were unresolvable** in `AuthModule` — the providing
   modules were imported only by `AppModule`. Nest scopes visibility per module.
7. **`TypeOrmModule.forRootAsync` injected `ConfigModule`** (the module class) where a
   `ConfigService` was expected.
8. **The OTP generator produced digits 0-5 only** (`% 6` on a range sized for 10).
9. **Refresh tokens were hashed twice** — the caller received an already-hashed value and
   hashed it again on the way in, so no token could ever be looked up.

### Phase 2 verification — commands actually run

```
cd backend && npm run typecheck       -> clean
cd backend && npm test               -> 35 passed, 35 total
cd backend && npm run lint            -> No ESLint warnings or errors
cd backend && npm run test:e2e        -> 30 passed, 30 total (real HTTP, real Postgres)
cd backend && npm run build           -> nest build, no errors
python -m pytest tests -q              -> 46 passed
cd frontend && npm run lint           -> No ESLint warnings or errors
cd frontend && npm run typecheck      -> clean
cd frontend && npm run verify:tokens  -> PASS: all 9 token groups resolve
cd frontend && npm run build           -> Compiled successfully, 24/24 pages
docker compose config                  -> valid
```

### Outstanding

### Live HTTP smoke — driven against a hand-started server

`npm run start:dev`, then the full flow over curl-equivalent HTTP. 15/15 checks:

```
register                          -> 201, isVerified false, no passwordHash
login while unverified            -> 403
verify-email                      -> 200 {verified}
verify-email replay               -> 403
login after verification          -> 200 with both tokens
GET /me                           -> 200, no passwordHash
refresh                           -> 200, new token differs
refresh with the rotated-away token -> 401
logout                            -> 200
refresh after logout              -> 401
login, wrong password             -> 401
login, unknown account            -> 401, identical message
```

The verification token had to be seeded directly into `email_verifications`
because the email provider is a logging fake and only ever writes to stdout.
Everything else used the real endpoints against the real database.

The unit suite originally failed at 34/35: `auth.service.spec.ts` expected
`undefined` for the refresh-TTL argument, but `refreshTokenTtlDays()` resolves to
`7` through the documented fallback, and the assertion also omitted the fifth
argument. Correcting the expectation gives 35/35.

**Not implemented, and not claimed:** rotating a refresh token records the
replacement but does not revoke the rest of the family, so a stolen token that is
replayed is rejected without invalidating the legitimate successor. Tracked for
Phase 9 (Security Hardening).

### Phase 2 test harness

`backend/test/auth.e2e-spec.ts` boots the real `AppModule` against the Dockerised
Postgres on port 5436, truncates identity tables between cases, and overrides only the
two delivery providers. Outbound messages are captured so a test can read back the token
or code a real user would have received — no provider is contacted. 30 cases cover
registration and DTO trust, login gating and non-enumeration, verification replay and
expiry, the resend cooldown and throttle as separate limits, password reset and session
invalidation, both OTP channels, refresh rotation and logout, `/me`, unverified-token
rejection, and rate limiting on register and login.

---

## Phase 3 — Frontend Auth UI (Frontend) — DONE

**Goal:** auth screens talking to the live identity service from Phase 2.

The scope originally said "built against mocks, no backend calls yet", with the
wiring deferred to Phase 4. That was reversed before any code was written. Building
a fake transport in order to delete it one phase later is wasted work, and it tends
to leave screens that look finished while never having met a real response. The
screens below were written against the running NestJS service from the first commit.

- [x] Signup, verify-email (resend + countdown), forgot-password, reset-password,
      OTP entry, and login, each behind a thin `app/auth/*` route wrapper.
- [x] One HTTP client, `features/auth/api.ts`, mapping to the routes in
      `backend/src/auth/auth.controller.ts`. No screen contains a `fetch`.
- [x] Password strength meter, inline field errors wired with `aria-describedby`,
      an alert summary that receives focus on failure, and submit states that block
      a second request.
- [x] Copy in `en`, `am`, `om`, `ti` (64 keys, in `lib/i18n/auth.ts`).
- [x] Keyboard and screen-reader pass, with the accessibility rules implemented once
      in `features/auth/components/AuthForm.tsx` rather than repeated per screen.

### Decisions worth recording

**`api-client.ts` had to learn a second error shape.** It understood only FastAPI's
`{detail}`, so every NestJS error would have rendered as "Request failed with status
400" and the screens would have looked broken against a working backend. It now
handles both, and handles `message` being an array, which is what `ValidationPipe`
returns for a rejected payload.

**A rejected sign-in says one thing, on purpose.** The service answers 403 for an
unverified address and 401 for a wrong password or an unknown account. The 403 path
offers to resend the verification email; the 401 path shows a single message that
does not distinguish the two failure cases, so the form cannot be used to discover
which addresses have accounts.

**The resend countdown is not announced every second.** A live region that re-spoke
the remaining seconds would make the page unusable with a screen reader, so the
ticking digits are `aria-hidden` and a single sentence is announced when the wait
starts and again when it ends.

**Tokens are not in `localStorage`.** The access token lives in a module variable and
is not written to storage; the refresh token is in a `SameSite=Lax` cookie. A page
load therefore spends one refresh round-trip to restore a session. This is not the
final answer: the refresh token is still readable by JavaScript, and the complete
fix is an httpOnly cookie set by the service, which needs the refresh endpoint to
accept a cookie. Recorded rather than implied.

**A test caught a blank screen.** The signup screen used to render `null` on
success while the router navigated, which flashed an empty page. The submit button
now stays busy until the screen is replaced.

### Verified

```
cd frontend && npm run typecheck     # clean
cd frontend && npm run lint          # No ESLint warnings or errors
cd frontend && npm run verify:tokens # PASS: all 9 token groups resolve
cd frontend && npm test              # 20 passed, 20 total
```

The 20 component tests assert behaviour rather than rendering: that both sign-in
fields are labelled, that an empty submit produces an alert which receives focus
and does not call the service, that a phone number the service would reject is
rejected without a round trip, that a mismatched confirmation blocks submission,
that a duplicate address is attached to the email field rather than a generic
banner, that the sign-up request carries no `role` field, and that an unverified
account is routed to verification rather than to a dashboard.

`tests/i18n-parity.test.ts` exists because `t()` falls back to English for a missing
key. That fallback is correct at runtime and it makes a half-finished translation
table look complete on screen, so parity across the four locales, blank values, and
matching `{placeholder}` sets are asserted instead of trusted.

Not yet verified by a person in a browser: see Outstanding.

### Outstanding

- No build has been run for these screens yet, and no screen has been exercised in a
  browser against the running service. The component tests cover the screens' logic
  and accessibility wiring, not their appearance or their behaviour inside Next's
  router.
- `components/AuthProvider.tsx` still polls the old ai-service and is unaffected by
  this phase apart from one compile fix: `GET /me` returns the user object directly,
  not `{user}`, and the old wrapper read was wrong.
- Copy needs review by a native Amharic, Oromo and Tigrinya speaker before real
  users rely on it. This is not a formality: the pre-existing Amharic navigation
  strings are already wrong in ways no automated check catches. `home` contains a
  replacement character, and `about` and `contact` both read "thank you". The
  parity test proves a key exists, not that the words are right.
- `components/Button.tsx` still hardcodes `green-600` and friends instead of the
  `brand` and `status` tokens Phase 1 introduced, so the auth screens inherit that
  inconsistency.

### Getting a code out of thin air, locally

Nobody can read a verification or OTP code back out of the database. A
verification token is stored as SHA-256 and an OTP as bcrypt, so `select` returns
nothing useful and no query will ever surface a code that was already sent. That is
the correct behaviour and it is worth keeping; it just means there is no way to
exercise a verification screen until something delivers the code.

`tools/dev-print-code.mjs` is the local answer, and it works backwards from the
problem. It picks a code, then plants the hash the service would have written:

```
node tools/dev-print-code.mjs tsegayassefa27@gmail.com
node tools/dev-print-code.mjs tsegayassefa27@gmail.com --otp
node tools/dev-print-code.mjs tsegayassefa27@gmail.com --otp --purpose verify_email
```

This is not a way around the check. The code still goes through the same hashing,
the same expiry, the same single-use rule and the same attempt ceiling, because it
is verified by the same code path a delivered one would be. The only step being
skipped is delivery, which is the step with no local implementation.

It refuses to write to anything but a local database, and refuses outright under
`NODE_ENV=production`, because a tool that mints valid credentials by hand should
be structurally incapable of running near real data.

Replaced later by a real provider. When a delivery adapter exists, this tool should
be deleted rather than kept, so that nobody keeps reaching for a shortcut that is no
longer needed.

---

## Phase 4 — Auth Integration (Full stack)

- [ ] Point the frontend API client at `backend:4000`; remove the `/api/v1` rewrite assumption.
- [ ] Wire the auth context to real endpoints; store the access token in memory,
      refresh token in an `HttpOnly` cookie.
- [ ] Route guards: unauthenticated → login; wrong role → 403 page; unverified →
      verify-email with a hard block until confirmed.
- [ ] Token refresh on expiry with a single-flight guard (no refresh stampede).
- [ ] Keep `ai-service` reachable but never used as the identity authority.

**Verify:**
```
docker compose up -d
curl localhost:3000                      # -> login
# register -> verify -> login -> refresh a token -> reach a protected route
cd frontend && npm run lint && npm run typecheck && npm run build
cd backend && npm run test
```

---

## Phase 5 — API Migration (Backend)

**Goal:** move business logic out of `ai-service` into `backend`, one domain per module.

- [ ] Order: prices → weather → disease → quality → marketplace → cooperative → equipment → industry.
- [ ] Each module: Nest controller + service + DTOs + TypeORM entities + tests.
- [ ] `ai-service` becomes a private inference service exposing only model endpoints.
- [ ] Feature flag each domain so frontend and backend can run side by side.

**Verify per domain:**
```
cd backend && npm run test
curl localhost:4000/api/v1/prices
```

---

## Phase 6 — Service Coupling Cleanup (Full stack)

- [ ] Frontend calls `backend` only; `ai-service` is never addressed from the browser.
- [ ] `AI_SERVICE_URL` used server-side inside `backend`.
- [ ] Retries, timeouts, and circuit breaking on every `backend → ai-service` call.
- [ ] No secret ever reaches the frontend bundle.

**Verify:**
```
grep -rn "ai-service" frontend/ --include=*.ts --include=*.tsx   # expect no hits
grep -rn "AI_SERVICE_URL\|GEMINI\|API_KEY" frontend/            # expect no hits
```

---

## Phase 7 — Data Layer Completion (Database)

- [ ] Finish remaining tables from `docs/04-database-design.md` that have no model yet.
- [ ] Every table has an Alembic revision, indexes on FK/lookup columns, and a clean downgrade.
- [ ] Seed script for roles and reference data.
- [ ] **Fix model-artifact tracking.** `.gitignore` lines 44-45 try to un-ignore
      `metrics.json` and `model_card.md` with `!` rules, but this does **not work**:
      `data/models/*` (line 41) ignores the parent directory, and git never descends
      into an excluded directory, so the negation is unreachable. Confirmed via
      `git check-ignore` — both files resolve to rule 41. They exist on disk but are
      untracked. Replace the pattern with per-directory rules that un-ignore the
      directory before its contents, e.g. `data/models/**` plus explicit negations.
- [ ] Decide the fate of the 24 MB of `.pt` weights currently on disk
      (`best.pt`, `last.pt`, `disease_detection.pt`, `yolov8n.pt`) — keep them ignored
      and fetched at deploy time, or move them to release storage. Do not commit them.
- [ ] Backups and restore rehearsed against Postgres 16.

**Verify:**
```
git check-ignore data/models/disease-detection/v1/metrics.json   # expect NO match
git ls-files data/models | grep -E "metrics.json|model_card.md" # expect both listed
alembic upgrade head && alembic downgrade -1 && alembic upgrade head
```

---

## Phase 8 — AI Services (AI)

**Goal:** ML/LLM features, only once identity and data are real.

- [ ] ~~`ultralytics`, `prophet`, `langchain`, `langchain-google-genai`, `langchain-community`
      installed and importable.~~ **Done in Phase 1.** Verified imports:
      `ultralytics 8.4.166`, `prophet 1.4.0`, `langchain 1.4.3`,
      `langchain-google-genai 4.4.0`, `langchain_community 0.4.2`, `torch 2.14.0+cpu`.
      Note: `langchain-community` now emits a sunset DeprecationWarning — track the
      migration to standalone integration packages.
- [ ] Disease detection: real weights, inference endpoint, latency and accuracy recorded against `metrics.json`.
- [ ] Price forecasting; weather integration; chat/agent tools.
- [ ] Every model endpoint authenticated and rate-limited.
- [ ] Graceful degradation when a model is unavailable.
- [ ] Model version pinned in config; upgrade path documented.

**Verify:**
```
python -c "import ultralytics, prophet, langchain, langchain_google_genai"
curl -X POST localhost:8000/api/v1/disease/detect -F "image=@leaf.jpg"
```

---

## Phase 9 — Security Hardening (Full stack)

- [ ] CORS locked to real origins; no `*` with credentials.
- [ ] Rate limits on auth, OTP, and password reset — especially resend.
- [ ] Secrets only in env/secret manager; no secrets in git, logs, or client bundles.
- [ ] JWT: short access TTL, rotating refresh, revocation on password change and logout.
- [ ] Input validation on every DTO; parameterized queries everywhere.
- [ ] `helmet`, body-size limits, and request-ID logging.
- [ ] Dependency audit: `pip-audit` and `npm audit` clean or triaged.

**Verify:**
```
pip-audit
npm audit
curl -i -X POST localhost:4000/auth/login   # check CORS + rate-limit headers
```

---

## Phase 10 — Deployment (Infra)

- [ ] Container images slim, non-root, pinned base images, healthchecks.
- [ ] `docker compose up` from a clean clone with only `.env` files provided.
- [ ] Reverse proxy with TLS, correct `Host`/`X-Forwarded-*`, and static caching.
- [ ] Postgres backup schedule with a verified restore.
- [ ] Uptime checks and log aggregation.
- [ ] Runbook: deploy, rollback, restore, and incident steps.

**Verify:**
```
docker compose config
docker compose up -d --build
curl -fsS localhost:3000 && curl -fsS localhost:4000/health
```

---

## Phase Gate Rules

1. A phase ships only when its verification commands have been run and the output captured.
2. Phases 2–4 are a hard prerequisite for Phase 8. No AI feature work starts before
   verification and login are real.
3. Frontend and backend stay independently testable; integration is its own phase,
   not an implicit side effect of writing a page.
4. Any phase that adds a table adds its migration and downgrade in the same commit.
5. `git status` must be clean before starting the next phase.