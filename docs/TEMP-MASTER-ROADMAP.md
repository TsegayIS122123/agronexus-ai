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
**Status: In Progress**

- [ ] **A — Data & model directories.** Move trained weights out of `backend/` into
      `data/models/<task>/<version>/` (e.g. `data/models/disease-detection/v1/best.pt`
      plus `metrics.json` and `model_card.md`). Add `data/raw/`, `data/processed/`, and
      keep the existing `data/dataset/disease/{images,labels}/{train,val,test}` as-is.
      Add `MODEL_VERSION` env var so `detector.py` reads a path built from it instead of
      a hardcoded filename. Gitignore `*.pt`, keep `metrics.json`/`model_card.md` tracked.
- [ ] **B — Backend core config.** Add `backend/app/core/config.py` as the single place
      that loads and validates every env var (existing + placeholder future ones for
      Chapa/email/SMS). Fix the dead `app.models.weather` import found in the audit —
      confirm first whether a route is silently broken because of it. Do not create a
      separate `backend/ai/` folder yet — that split happens only once NestJS exists and
      there's a real contract to split against (doc 09).
- [ ] **C — Frontend feature reorganization.** Restructure `frontend/` from page-grouped
      to feature-grouped: `features/{auth,farmer,processor,consumer,marketplace}/`, each
      with its own `api.ts` that calls a single shared `lib/api-client.ts` — this is what
      actually fixes the route-mismatch bugs found earlier, since every path lives in one
      file instead of scattered across pages. Add shared `components/Header.tsx`,
      `Footer.tsx`, `Sidebar.tsx` (none currently exist). Add `lib/theme.ts` documenting
      the already-implemented role colors (farmer=green-700/900, processor=blue-700/900,
      consumer=purple-700/900) as named constants instead of repeated class strings.
      Move pages into `features/` one module at a time — verify the build after each.
- [ ] **D — Env alignment.** `.env.example` in backend/frontend/root gets the new
      `MODEL_PATH`/`MODEL_VERSION` vars plus clearly-commented `# Planned — not yet used`
      placeholders for Chapa/email/SMS keys. Don't add `REDIS_URL` until Redis actually
      exists in `docker-compose.yml`.
- [ ] **E — CI check.** Confirm `alembic upgrade head` and `pytest` still pass after A–D
      (model files moving shouldn't affect either). Add a plain `npm run build` step to
      CI as a smoke check that the frontend reorg didn't break imports.

**Order matters: A → B → C → D → E.** C is the largest change — do it feature-by-feature,
not all at once, and re-run the route-mismatch check after each module moves.

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

## What to push right now (end of Phase 1 + start of Phase 2)

The current working tree already contains real, tested Phase 1 work plus the new docs.
Nothing here is speculative — it's what's already on disk per your `git status` output.
