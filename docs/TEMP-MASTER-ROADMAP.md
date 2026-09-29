# TEMPORARY — Master Phase Roadmap (Whole Project)

> Working document, not part of the numbered 01–09 set. Tracks where the project
> actually stands across documentation, security, structure, features, and deployment.
> Update the status column as phases complete; delete once Phase 8 is done and the
> numbered docs alone are sufficient to onboard someone new.

## How to read this

- **Status: Done** — implemented AND tested/verified, matching the Implemented/In
  Progress/Planned rule in `09-platform-decision-rule.md` §7.
- **Status: In Progress** — started, not fully verified yet.
- **Status: Not started** — nothing built yet.

---

## Phase 0 — Documentation Foundation
**Status: Done**

- Docs 01–09 written (product overview, SRS, SDS, database design, UI/UX spec, AI
  system spec, testing/QA, deployment/DevOps, platform decision rule).
- Doc 02 rewritten to remove route/flow duplication; canonical route reference lives in
  doc 03 instead.
- README rewritten with honest Implemented/In Progress/Planned status per capability.

## Phase 1 — Security Hardening (current FastAPI backend)
**Status: Done**

- Public registration no longer accepts `role=admin`.
- `SECRET_KEY` has no fallback; app fails to start if missing or too short.
- Login/registration set the `access_token` cookie the auth guard actually reads
  (`SameSite=Lax`, `Secure` via `COOKIE_SECURE`).
- Order status authorization checks actual `buyer_id`/`seller_id`, not role names.
- `Base.metadata.create_all()` removed; Alembic migrations added, initial migration
  generated and verified against a clean database.
- Disease detection fallback path (`_smart_detection()`) explicitly flagged
  `fallback_mode: true/false` in the API response and logs — no more silent fabricated
  diagnoses.
- Real pytest suite (12 tests) covering all of the above; CI runs it instead of
  echo-only checks.

## Phase 2 — Repository Reorganization
**Status: Done**

- [x] **A — Data & model directories.** Weights live at
      `data/models/disease-detection/v1/` (`best.pt` gitignored, `metrics.json`
      and `model_card.md` tracked). `MODEL_PATH` and `MODEL_VERSION` drive the
      detector; `data/dataset/disease/{images,labels}/{train,val,test}` unchanged.
- [x] **B — Backend core config.** `ai-service/app/core/config.py` is the single
      validated env surface; all five previous `os.getenv` call sites
      (`database.py`, `auth_service.py`, `chat_service.py`, `weather_service.py`,
      `disease/detector.py`) plus `alembic/env.py` now read from it. The dead
      `app.models.weather` import was confirmed to be breaking startup —
      `main.py` includes the weather router, so the whole service failed to
      import — and is removed. No separate `ai/` folder, per doc 09.
- [x] **C — Frontend feature reorganization.** `features/{auth,farmer,
      processor,consumer,marketplace}/` with shared `components/` and `lib/theme.ts`.
      Note: the `features/*/api.ts` layer calls `lib/api-client.ts` with paths
      that omit the `/api/v1` prefix and are not imported by any component yet.
      Migrating the live `axios` call sites onto that layer is still outstanding.
- [x] **D — Env alignment.** `ai-service/.env.example` and
      `frontend/.env.example` both document the current surface, with
      `# Planned — not yet used` sections for Chapa/email/SMS. `REDIS_URL` is
      deliberately absent until Redis exists in `docker-compose.yml`.
- [x] **E — CI check.** `verify-migration.yml` runs `alembic upgrade head`
      against a real Postgres and then pytest; `ci.yml` already builds the
      NestJS scaffold and the Next.js app. The migration path was adjusted so
      `alembic` no longer needs a `SECRET_KEY` to import `app.database`.

**Follow-ups carried out of Phase 2, worth recording:**

- `weather_service.py` had a dead `from app.models.weather import WeatherData`
  (no such module). Because `main.py` includes the weather router, this raised
  `ImportError` at startup — the API could not boot at all.
- `detector.py` called `YOLO(...)` without ever importing it. The `NameError`
  was swallowed by a broad `except`, so the trained weights never loaded and
  every diagnosis fell through to the randomized fallback. The guard now
  mirrors the existing `cv2`/`numpy` handling.
- `ALGORITHM` became operator-controlled as a side effect of the migration, so
  it is now validated against an HMAC allowlist; `none` is rejected.
- The signing key is read per request rather than frozen at import, so rotating
  `SECRET_KEY` invalidates outstanding tokens without a restart.


## Phase 3 — Identity & Notifications
**Status: Not started**

- Email verification: real send via a provider (Resend, or log-only in dev mode),
  hashed single-use token, expiry, `/verify-email` flow.
- Password reset: same token pattern, generic response regardless of whether the email
  exists, 15–30 min expiry.
- SMS OTP: provider chosen (Telnyx primary, confirm actual Ethiopia delivery before
  committing; Vonage as fallback), hashed code, attempt limit.
- Notification sending is asynchronous — FastAPI `BackgroundTasks` or Celery is
  acceptable here as an interim step; full BullMQ/Celery split per doc 03 happens after
  the NestJS migration starts (Phase 5), not before.
- New tables: `email_verification_tokens`, `password_reset_tokens`, `otp_challenges`
  (already specified in doc 04).

## Phase 4 — Marketplace Correctness & Chapa Payments
**Status: Not started**

- Convert `Float` price/quantity columns to `NUMERIC(12,2)` — flagged in the original
  code audit, not yet fixed.
- Add `payments` and `payment_events` tables (doc 04).
- Chapa sandbox integration: `initialize` → redirect → webhook → server-side `verify`
  → idempotent order state update. Never trust a client redirect alone.
- Order total always computed server-side from listing price at order time
  (`unit_price_at_purchase`), never from client input.
- Tests: duplicate webhook produces one state change; forged/stale webhook does not
  mark an order paid (per doc 07 §3).

## Phase 5 — NestJS Migration (start)
**Status: Not started**

Per doc 09's migration order — do not reorder these:

1. Shared API contract + environment configuration between NestJS and FastAPI.
2. Auth, users, roles, sessions, audit logs move to NestJS first.
3. Marketplace listings and orders.
4. Payments and notifications.
5. WebSocket events.
6. AI gateway: NestJS calls FastAPI internally via a signed service token; the browser
   never calls FastAPI directly (doc 03 §3).
7. Retire the duplicated FastAPI business routes only after parity tests pass — the
   FastAPI auth/marketplace routes stay live until their NestJS replacements are proven
   equivalent, not before.

**Do not start this phase until Phases 3–4 are done on the current FastAPI backend.**
Migrating unfinished or unhardened features just relocates the same gaps into a second
codebase.

## Phase 6 — AI System Maturity
**Status: Not started**

- RAG: replace the hardcoded `KNOWLEDGE_BASE` dict with a real document store and
  actual retrieval (FAISS or pgvector) before generation — currently the chat path
  skips retrieval entirely (per the last audit).
- Model versioning/logging made consistent across disease detection, price forecasting,
  and chat — not just partially present as found in the audit.
- First real evaluation report for the disease model: precision/recall/mAP on a held-out
  set, committed as `metrics.json` + `model_card.md` (Phase 2A already prepares the
  folder for this).
- Price forecasting: confirm data freshness/provenance, add the naive baseline
  comparison doc 06 requires before trusting Prophet's numbers.

## Phase 7 — Testing & CI Maturity
**Status: Not started**

- Expand beyond the 12 hardening tests: integration tests against a real (dockerized)
  Postgres, contract tests once NestJS↔FastAPI exists, E2E for register→detect→list→
  order→pay.
- Frontend test suite (currently zero, per audit) — start with the auth and checkout
  flows, not full coverage.
- Security scan step in CI (dependency + secret scanning), per doc 08 §5.

## Phase 8 — Deployment
**Status: Not started**

- Staging environment matching doc 08's topology (Next.js, NestJS, FastAPI, Postgres,
  Redis, Chapa sandbox).
- Production secrets via a secret manager, never the repo.
- Health/readiness checks, structured logging, basic alerting (payment verification
  failures, repeated auth failures).
- Deployment acceptance checklist from doc 08 §8 run once, in full, before calling
  anything "deployed."

---

## What to push right now (end of Phase 2, start of Phase 3)

Phases 0, 1, and 2 are complete. The FastAPI service boots, `alembic upgrade
head` runs against a clean database, and `pytest` passes. The next unit of work
is Phase 3 — identity and notifications — not the NestJS migration, which stays
blocked until Phases 3 and 4 land on the current backend.

