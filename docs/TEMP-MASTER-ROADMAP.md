# TEMPORARY — Master Phase Roadmap (Whole Project)

> Working document, not part of the numbered 01–09 set. Tracks where the project
> actually stands across documentation, security, structure, features, and deployment.
> Update the status column as phases complete; delete once the numbered docs alone are
> sufficient to onboard someone new.

## How to read this

- **Status: Done** — implemented AND tested/verified, matching the Implemented/In
  Progress/Planned rule in `09-platform-decision-rule.md` §7.
- **Status: In Progress** — started, not fully verified yet.
- **Status: Not started** — nothing built yet.

> **Architectural note:** the phase order below was re-derived from a full repo audit.
> The old Phase 0–8 sequence has been superseded. Frontend core layout, secure-auth UI
> wiring, and API-layer migration now come before AI maturity and the NestJS migration,
> because the current prototype cannot be hardened piecemeal until the presentation and
> integration layers are consistent.

---

## Phase A — Global Layout Foundations
**Status: Not started**

Establish the universal presentation primitives that every page will share. Until this
phase lands, each page owns its own header, footer, navigation, and styling tokens, which
is the root cause of the current inconsistency.

- [ ] **Shared root layout.** `frontend/app/layout.tsx` gets a persistent universal header,
      universal footer, and a react-context-backed navigation state. Every render surface
      (public pages and protected role pages) uses the same layout shell.
- [ ] **Universal accessible header.** Contextual per-role header component with:
      - skip-to-main link first in tab order,
      - semantic `<header>`/`<nav>`/`<main>`/`<footer>` landmarks,
      - `aria-current` on the active route,
      - mobile hamburger menu with focus trap and Esc dismissal,
      - locale/language selector wired to the same state the backend uses.
- [ ] **Universal accessible footer.** One shared footer with consistent links, contact info,
      and legal text; identical on every route.

- [ ] **Responsive navigation system.** One navigation model shared across public and role
      pages. Role-specific links are injected from the same source of truth, not copy-pasted
      into each page.
- [ ] **Tailwind design tokens.** Extend `frontend/tailwind.config.js` with a documented
      token set: color palette (including role colors already in `lib/theme.ts` but not in
     Tailwind config), spacing scale, font-size/line-height scale, and semantic color keys
      (e.g. `color: primary`, `color: surface`, `color: text/on-surface`) so components stop
      hardcoding raw Tailwind values.
- [ ] **Standardized accessible button system.** One set of `<Button>` / `<LinkButton>` primitives
      (sizes, variants, loading/disabled/icon states) used everywhere, including focus-visible
      styles and disabled behavior.
- [ ] **Typography scale.** Documented type scale applied consistently across headings, body,
      captions, and form labels. No per-page magic numbers.
- [ ] **Accessibility baseline.** Every new layout and component must pass a manual check for:
      keyboard navigation, focus order, color contrast, form label association, and screen-reader
      text. WCAG 2.1 AA is the target; violations block the PR.

**Exit criteria:** any new page added after this phase uses the shared layout shell and tokens
instead of rebuilding header/footer/nav from scratch.

## Phase B — Hardened Secure Authentication & Onboarding UI
**Status: Not started**

Wire the existing secure FastAPI auth backend to the frontend through the centralized API
layer, and remove the insecure client-side token handling that the current pages use.

- [ ] **Consolidate session state.** Remove `localStorage` token storage from all pages. The
      frontend session model must match the backend: the `access_token` lives in the HTTP-only
      cookie that FastAPI sets; the browser does not read or write it from JS. A client-side
      auth hook/context reads user identity from a protected endpoint or from the cookie-safe
      proxy, not from `localStorage`.
- [ ] **Migrate auth pages to `lib/api-client`.** `features/auth/LoginPage` and `RegisterPage`
      currently call raw `axios` and manually set cookies. Rewrite them to use `features/auth/api.ts`
      (which already exists and uses `lib/api-client`) so the call sites go through the shared
      HTTP layer.
- [ ] **Registration flow alignment.** Ensure the registration UI enforces the same role validation
      the backend now requires (only `farmer`, `processor`, `consumer`; admin provisioning is
      server-side) and surfaces backend validation errors through the shared error formatter.
- [ ] **Post-login routing.** After a successful login/register, route the user to the correct
      role dashboard using the server-validated role, not a client guess. The current pages write
      a `user_role` cookie manually — remove that and rely on the backend session.
- [ ] **Protected route wrapper.** Add a reusable protected-route component/hoc that checks the
      session and redirects to login with a return URL, so every role dashboard stops repeating
      its own auth check.
- [ ] **Logout.** One shared logout action that clears the session through the API layer and
      returns the user to a known public route.

**Exit criteria:** login, register, and logout flow through the centralized API client; no
auth page writes tokens to `localStorage`; role-based routing reflects the server-provided role.

## Phase C — API Migration (Raw Axios → Feature API Modules)
**Status: Not started**

Move every scattered `axios` call in `features/` onto the existing per-feature API modules and
the shared `lib/api-client`, so the frontend has one approved way to talk to the backend.

- [ ] **Audit call sites.** The audit found raw `axios` imports and calls in:
      `features/auth/RegisterPage`, `features/auth/LoginPage`, `features/farmer/DiseasePage`,
      `features/farmer/ChatPage`, `features/farmer/PricesPage`, `features/processor/QualityPage`,
      `features/processor/FeasibilityPage`, `features/processor/EquipmentPage`,
      `features/marketplace/MarketplacePage`, `features/marketplace/NewListingPage`,
      `features/marketplace/OrdersPage`, `features/marketplace/ListingDetailPage`, and likely more.
      Official count from the audit: ~46 raw axios call sites.
- [ ] **Finish the feature API modules.** The `features/*/api.ts` files already exist and use
      `lib/api-client`, but many of them are incomplete or define interfaces that don't match the
      real backend responses. Bring each module up to date with the actual backend contract before
      the pages switch to them.
- [ ] **Migrate pages one feature area at a time.** Replace raw `axios` imports with the matching
      `features/<area>/api.ts` exports. Keep behavior identical during the migration; do not refactor
      UI logic and API calls in the same PR.
- [ ] **Normalize path handling.** `lib/api-client` already builds URLs from the browser origin, but
      some feature modules still use ad-hoc paths (for example `/api/disease/...` vs
      `/api/v1/disease/...`). Pick one convention and make every API module consistent.
- [ ] **Shared error handling.** Route all backend errors through one frontend error surface (toast/
      inline message/modal) instead of per-page `setError(...)` fragments, so accessibility and
      i18n of errors is consistent.

**Exit criteria:** no feature page imports `axios` directly; every backend call goes through
`lib/api-client` via a per-feature API module; the modules are imported and exercised by real
components.

## Phase D — Backend-to-Frontend Service Coupling & Integration
**Status: Not started**

Make the presentation layer and the backend behave like one integrated system rather than two
halves that happen to share URLs.

- [ ] **Single API base contract.** Ensure Next.js rewrites/proxy, `lib/api-client`, and the feature
      modules all agree on the base path and credential handling, so developers cannot accidentally
      bypass the proxy and hit FastAPI directly from the browser.
- [ ] **Role-aware UI from one source of truth.** Role colors already exist in `lib/theme.ts`, but the
      Tailwind config does not know about them and pages recompute role styling independently. Wire
      the theme tokens into Tailwind so role-based surfaces come from the same tokens everywhere.
- [ ] **Consistent loading, empty, and error states.** Each feature area currently renders its own
      loading/empty/error UI. Introduce shared patterns (or at least shared contracts) so the user
      sees one visual language for "loading", "no data", and "error" across dashboards.
- [ ] **Form and input consistency.** Forms already use broadly similar Tailwind classes, but labels,
      required indicators, validation styling, and helper text are inconsistent. Align them behind
      shared form components as part of Phase A/B so accessibility improves everywhere at once.
- [ ] **Auth guard parity.** Verify that the frontend protected routes and the backend role guards
      agree on what each role can see and do. The audit found the frontend sometimes decides
      visibility by local role state; the backend must remain the final authority.

**Exit criteria:** a new feature page can be built by composing shared layout, shared form/feedback
primitives, and a feature API module, without reintroducing raw axios or copy-pasted header/footer
logic.

## Phase E — Advanced AI Services (Production YOLO + Real RAG)
**Status: Not started**

Replace the prototype AI paths that currently fabricate or shortcut results with real, evaluated,
and observable AI behavior.

- [ ] **Disease detection — load the real model confidently.** `detector.py` still falls through to
      the heuristic/dummy path in the normal case. Fix the model-loading guard so the trained weights
      actually load, add clear startup logging, and fail the service loudly if the expected model is
      missing rather than silently pretending.
- [ ] **Disease detection — evaluation.** Produce a real evaluation report (precision/recall/mAP) on a
      held-out set and commit `metrics.json` + `model_card.md` in
      `data/models/disease-detection/v1/`. This is the first truthful measure of model quality; until
      it exists the fallback behavior is the de-facto production behavior.
- [ ] **RAG — replace the hardcoded knowledge base.** `chat_service.py` currently matches keywords in a
      static `KNOWLEDGE_BASE` dict and otherwise calls Gemini with no retrieved context. Add a real
      document store and retrieval step (FAISS or pgvector) so the assistant answers from approved,
      non-expired knowledge documents as specified in doc 04 §4.25 and doc 06.
- [ ] **Price forecasting — provenance and baseline.** Confirm the Prophet input data source/freshness
      and add the naive baseline comparison doc 06 requires before the numbers are treated as
      trustworthy.
- [ ] **AI safety and review signals.** Ensure low-confidence detections are flagged for review and that
      the frontend can represent `fallback_mode` / confidence honestly instead of presenting every
      result as authoritative.

**Exit criteria:** the disease endpoint no longer depends on fabricated fallback as the common path,
and the chat assistant retrieves from a real knowledge source before generating.

## Phase F — Production Infrastructure (DB Tuning, Numeric Migrations, Containerization)
**Status: Not started**

Make the data layer and runtime match the design documents and the demands of real usage.

- [ ] **Money/quantity type migration.** Convert `Float` price and quantity columns to the types doc 04
      specifies (`NUMERIC(12,2)` for quantities; integer minor units for money where the design calls
      for it). This affects `marketplace_listings`, `marketplace_orders`, `equipment_listings`,
      `feasibility_reports`, `product_specs`, `price_history`, and others. This is a schema migration,
      not a cosmetic change — plan data conversions and backfill explicitly.
- [ ] **Schema alignment with doc 04.** Bring current models and migrations toward the documented
      contract: soft deletes, token tables, notifications, audit logs, and the other tables already
      specified but not yet created.
- [ ] **Database tuning.** Add the indexes called out in doc 04, review query patterns on hot paths
      (marketplace listings, orders, price forecast), and partition/time-scale the price time-series
      table as usage grows.
- [ ] **Containerization & runtime hardening.** Make `docker-compose.yml` and the service Dockerfiles
      reflect the real runtime: correct ports, health checks, dependency ordering, and any missing
      infra (for example Redis where the design expects it). Keep secrets out of the repo.
- [ ] **Observability baseline.** Add structured logging and basic health/readiness surfaces so the
      platform can be operated beyond local development.

**Exit criteria:** money/quantity data is stored in safe types, the running schema matches the design
document, and the containerized local stack is a truthful representation of the intended runtime.

---

## Legacy phases (superseded)

The old Phase 0–8 numbering in earlier revisions of this file is no longer the active plan.
For the current canonical status of documentation, security hardening, and repository
reorganization work, see the status notes below and the README capability table.

- Old Phase 0 (Documentation Foundation): effectively Done — docs 01–09 exist, but the roadmap
  itself now needs this rewrite.
- Old Phase 1 (Security Hardening): Done for the backend auth/authz items it covered; the frontend
  auth UI still needs the Phase B wiring.
- Old Phase 2 (Repository Reorganization): Done for the structural changes it covered; the frontend
  API migration (Phase C) is the part that was noted as outstanding and is now promoted.

---

## Current position (validated baseline)

As of this rewrite, the project is at the start of **Phase A**.

What is already true:

- The FastAPI backend boots, migrations apply, and the 12 hardening tests pass.
- The Next.js app builds and has real feature pages.
- The NestJS scaffold builds but is not the active business backend.
- The docs 01–09 set exists and is detailed.

What is not yet true and is now prioritized:

- There is no shared universal layout, header, footer, or navigation system.
- The frontend auth pages bypass the centralized API layer and store tokens insecurely.
- The frontend still contains dozens of raw axios call sites instead of using the feature API
  modules.
- The disease and chat AI paths still degrade to fabricated/keyword behavior in the normal case.
- Money and quantity columns are `Float` everywhere instead of the types doc 04 specifies.

The next action is to start Phase A and build the shared presentation foundation before any
further feature work.


