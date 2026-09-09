# 09 — Platform Decision Rule

## 1. Decision

AgroNexus AI uses **Next.js + NestJS + FastAPI/Python** as the long-term platform direction.

- Next.js owns the web experience.
- NestJS owns product and transaction workflows.
- FastAPI/Python owns AI and ML.

The current FastAPI codebase remains valuable as the working prototype and AI capability base. It should be migrated incrementally, not discarded or rewritten in one risky step.

## 2. Why this is the right portfolio decision

This architecture demonstrates three complementary skills:

| Skill | Evidence |
|---|---|
| Full-stack development | Next.js, TypeScript, responsive role-based workflows |
| Secure backend engineering | NestJS modules, guards, validation, payments, queues, audit logs |
| AI/ML engineering | Python inference, model evaluation, RAG, forecasting, MLOps |

Moving business modules to NestJS does not weaken the AI profile. It demonstrates that AI is being integrated into a real product rather than isolated in a notebook.

## 3. Migration rule

Migrate a module to NestJS only when all conditions are true:

1. The module has a written requirement and API contract.
2. Its data ownership and authorization rules are documented.
3. Tests exist for current behavior.
4. The new implementation can be deployed and rolled back independently.
5. The migration improves maintainability, security, or product capability.

## 4. Migration order

```text
1. Shared API contract and environment configuration
2. Auth, users, roles, sessions, and audit logs
3. Marketplace listings and orders
4. Payments and notifications
5. WebSocket events
6. AI gateway from NestJS to FastAPI
7. Retire duplicated FastAPI business routes after parity tests
```

## 5. Technology selection rules

| Need | Choose | Do not choose |
|---|---|---|
| AI model training/inference | Python + FastAPI | Reimplementing ML in TypeScript |
| Transactional API | NestJS | Adding a second business backend without ownership |
| Web UI | Next.js | Exposing internal AI services to the browser |
| Relational transactions | PostgreSQL + Prisma migrations | `create_all` in production |
| Short-lived state and queues | Redis + BullMQ/Celery | Treating Redis as permanent business storage |
| Ethiopian checkout | Chapa adapter | Coupling order logic directly to provider payloads |
| Long-running work | Queue worker | Blocking HTTP request threads |

## 6. When not to split further

Do not introduce microservices for every feature. Keep NestJS as a modular monolith until independent scaling, deployment ownership, fault isolation, or team boundaries justify a split. Keep FastAPI focused on AI rather than duplicating users, orders, and payment rules.

## 7. Portfolio truth rule

Documentation must label each capability as one of:

- **Implemented:** exists in the repository and is covered by tests.
- **In progress:** code exists but is incomplete or not production-ready.
- **Planned:** architecture or requirements are documented, but implementation is not present.

The README must never call a planned feature complete.
