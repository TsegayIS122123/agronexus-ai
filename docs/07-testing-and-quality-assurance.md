# 07 — Testing and Quality Assurance

## 1. Quality objective

The system is ready for a portfolio demonstration when the critical farmer-to-payment workflow is repeatable, security controls are tested, AI claims are supported by evaluation evidence, and a clean checkout can reproduce the deployment.

## 2. Test pyramid

| Level | Scope | Tools | Target |
|---|---|---|---|
| Unit | Services, guards, state machines, validators, model utilities | Jest, pytest | Fast feedback; critical logic covered |
| Integration | Database, Redis, queues, provider adapters, FastAPI contracts | Testcontainers, pytest | All critical boundaries |
| Contract | NestJS to FastAPI request/response compatibility | OpenAPI validation | Every internal endpoint |
| End-to-end | Register, verify, detect, list, order, pay, recover account | Playwright | Critical journeys |
| Model | Accuracy, calibration, robustness, retrieval quality | pytest, ML evaluation scripts | Published metrics and thresholds |
| Performance | CRUD, inference, queue throughput, webhook bursts | k6 or Locust | p95 targets from SRS |
| Security | Dependency, secret, static, dynamic, authorization tests | npm audit, pip-audit, Semgrep, OWASP ZAP | No critical findings |

## 3. Critical test cases

### Authentication

- Public registration cannot create `admin`.
- Wrong passwords return the same generic response as unknown emails.
- Login throttling blocks repeated attempts.
- Access cookies are HTTP-only and secure outside development.
- Refresh token rotation revokes the previous token.
- Reset tokens expire, are hashed at rest, and cannot be reused.
- Suspended users cannot authenticate.

### Authorization

- A user cannot read or modify another user's order, listing, profile, or inference history.
- Role changes require admin permission and create an audit event.
- Frontend route protection cannot bypass backend guards.

### Marketplace and payments

- Quantity cannot become negative under concurrent orders.
- Total amount is calculated by the server.
- Invalid order transitions fail without changing state.
- Chapa amount, currency, and `tx_ref` are verified server-side.
- Duplicate webhooks produce one state change.
- Forged or stale webhooks do not mark an order paid.
- Failed payment can be retried without creating an inconsistent order.

### AI

- Invalid and oversized images are rejected.
- A known evaluation fixture produces a documented result range.
- Low-confidence detection returns `needs_review`.
- RAG answers include approved citations when evidence exists.
- Prompt injection text cannot override system safety rules.
- Forecast output includes freshness and uncertainty metadata.

## 4. Quality gates

Every pull request must pass:

```text
format -> lint -> type check -> unit tests -> integration tests
  -> contract tests -> frontend build -> dependency/security scan
```

The main branch additionally requires migration validation, container build, and a smoke test against a temporary environment.

## 5. Test data rules

- Use synthetic users and sandbox payment references.
- Never commit real phone numbers, email addresses, provider keys, or personal images.
- Keep AI fixtures licensed and documented.
- Reset integration databases between test runs.
- Redact provider payloads and personal data from test logs.

## 6. Release evidence

Each release records:

- Git commit and migration version
- Test summary and coverage
- Dependency scan result
- AI evaluation report and model checksum
- Deployment version and rollback target
- Known limitations and unresolved risks
