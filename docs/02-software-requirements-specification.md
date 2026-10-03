# 02 - Software Requirements Specification (SRS)

> AgroNexus AI - What the platform must do and how well it must do it.

| | |
|---|---|
| **Document** | 02 - Software Requirements Specification |
| **Version** | 1.1 |
| **Author** | Tsegay Assefa |
| **Status** | Draft - in review |
| **Last updated** | 2026-09-09 |

---

## 1. Purpose and scope

This document defines the product capabilities and quality requirements for AgroNexus AI. It is the requirements contract for the product overview in `01` and the design, database, AI, testing, and deployment documents in `03`-`09`.

It intentionally does **not** define API paths, transport protocols, cookie or session implementation, database columns, or sequence diagrams. Those implementation details belong in [03 - Software Design Specification](03-software-design-specification.md), [04 - Database Design](04-database-design.md), and the supporting documents.

## 2. System scope

| Component | Stack | Responsibility |
|---|---|---|
| Frontend | Next.js and TypeScript | User experience, localized screens, forms, dashboards, and accessible feedback |
| Platform backend | NestJS and TypeScript | Identity, authorization, marketplace, orders, payments, notifications, audit, and public business boundary |
| AI service | FastAPI and Python | Vision, RAG, forecasting, quality analysis, training, evaluation, and inference |
| Infrastructure | PostgreSQL, Redis, object storage, queues | Durable business data, ephemeral state, media, and asynchronous work |

## 3. Actors

| Actor | Responsibility |
|---|---|
| Farmer | Uses agricultural intelligence, sells crops, and buys when acting as a buyer |
| Processor | Sources agricultural supply, runs quality/feasibility analysis, and buys or sells through the marketplace |
| Consumer | Browses and purchases enabled local products |
| Platform Admin | Human operator who manages users, moderation, refunds, AI review, and platform reporting |
| System/AI | Non-human automation that runs inference, jobs, notifications, webhooks, and audit recording without human admin privileges |

## 4. Definitions and identifier rules

| Term | Meaning |
|---|---|
| Functional requirement | A product capability identified by a module-scoped ID such as `FR-AUTH-01`, `FR-MARKET-01`, or `FR-AI-01` |
| Non-functional requirement | A quality, security, performance, reliability, usability, maintainability, or portability constraint |
| RBAC | Role-Based Access Control; permissions granted by role and constrained by resource ownership |
| OTP | One-Time Password used for a short-lived verification challenge |
| Idempotency | Repeating a command does not create additional business effects |
| Minor unit | Smallest supported currency unit used for monetary arithmetic |
| System/AI | Automated actor distinct from the human Platform Admin |

The `FR-*` identifiers below are the canonical functional requirement IDs. Each requirement appears once. Actor permissions are defined only in the matrix in section 5.

## 5. Actor Permission Matrix

Legend: `✓` permitted, `✗` not permitted, `conditional` permitted only when the stated ownership, verification, or workflow condition is satisfied.

| Requirement ID | Farmer | Processor | Consumer | Platform Admin |
|---|---:|---:|---:|---:|
| FR-AUTH-01 Register an account | ✓ | ✓ | ✓ | ✗ provisioned |
| FR-AUTH-02 Verify account identity | ✓ | ✓ | ✓ | conditional |
| FR-AUTH-03 Authenticate and manage own session | ✓ | ✓ | ✓ | ✓ |
| FR-AUTH-04 Recover own account | ✓ | ✓ | ✓ | conditional |
| FR-USER-01 Manage own profile | ✓ | ✓ | ✓ | conditional |
| FR-USER-02 Manage roles and account status | ✗ | ✗ | ✗ | ✓ |
| FR-MARKET-01 Create a listing | ✓ | ✓ | ✗ | conditional owned/admin listing |
| FR-MARKET-02 Browse and search listings | ✓ | ✓ | ✓ | ✓ |
| FR-MARKET-03 Update or deactivate a listing | conditional owner | conditional owner | ✗ | ✓ |
| FR-MARKET-04 Maintain listing availability and expiry | conditional owner | conditional owner | ✗ | ✓ |
| FR-ORDER-01 Create an order | conditional buyer | conditional buyer | conditional enabled buyer | conditional |
| FR-ORDER-02 View and track own orders | conditional participant | conditional participant | conditional buyer | ✓ |
| FR-ORDER-03 Transition or cancel an order | conditional participant | conditional participant | conditional buyer | conditional operator |
| FR-ORDER-04 Review a completed order | conditional participant | conditional participant | conditional buyer | ✗ |
| FR-PAY-01 Initialize and complete a payment | conditional buyer | conditional buyer | conditional buyer | ✗ |
| FR-PAY-02 Verify, reconcile, or refund payment state | ✗ | ✗ | ✗ | conditional refund |
| FR-NOTIF-01 Receive notifications | ✓ | ✓ | ✓ | ✓ |
| FR-NOTIF-02 Configure and deliver notifications | ✗ | ✗ | ✗ | conditional policy |
| FR-AUDIT-01 View own audit-relevant history | conditional own records | conditional own records | conditional own records | ✓ platform-wide |
| FR-AUDIT-02 Search and govern audit records | ✗ | ✗ | ✗ | ✓ |
| FR-WS-01 Receive live platform events | ✓ | ✓ | ✓ | ✓ |
| FR-WS-02 Participate in authorized order communication | conditional participant | conditional participant | conditional buyer | conditional |
| FR-AI-01 Use disease detection | ✓ | conditional | ✗ | conditional review |
| FR-AI-02 Use agricultural assistant | ✓ | conditional | ✗ | conditional |
| FR-AI-03 View price forecasts and weather intelligence | ✓ | ✓ | ✗ | ✓ |
| FR-AI-04 Run quality or feasibility analysis | ✗ | ✓ | ✗ | conditional |
| FR-AI-05 Review or correct flagged AI results | ✗ | ✗ | ✗ | ✓ |
| FR-KB-01 Govern approved knowledge sources | ✗ | ✗ | ✗ | ✓ |
| FR-ADMIN-01 Operate platform administration | ✗ | ✗ | ✗ | ✓ |

The System/AI actor is not included as a human permission column. It performs only controlled automated functions defined in `FR-SYS-01` through `FR-SYS-04` and cannot suspend users, change roles, or issue discretionary refunds.

## 6. Functional requirements

### 6.1 Authentication and accounts

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Farmers, processors, and consumers can create accounts with validated identity and role data; administrator accounts are provisioned, not self-registered. | Must |
| FR-AUTH-02 | A user can verify the contact methods required for their role before receiving the related protected capabilities. | Must |
| FR-AUTH-03 | A verified user can authenticate, end a session, and renew an authorized session without exposing credentials. | Must |
| FR-AUTH-04 | A user can recover their own account through a one-time, expiring recovery process without account enumeration. | Must |
| FR-AUTH-05 | Authentication events and failed attempts are observable and auditable. | Must |

### 6.2 Users, roles, and profiles

| ID | Requirement | Priority |
|---|---|---|
| FR-USER-01 | A user can view and update their own role-appropriate profile. | Must |
| FR-USER-02 | Each account has exactly one supported role and role changes require Platform Admin action. | Must |
| FR-USER-03 | Resource access requires both role permission and ownership or participation where applicable. | Must |
| FR-USER-04 | Platform Admin can suspend or reactivate an account and the change is auditable. | Should |

### 6.3 Marketplace

| ID | Requirement | Priority |
|---|---|---|
| FR-MARKET-01 | A farmer or processor can publish a listing with product identity, quantity, unit, price, region, quality information, certifications, and media. | Must |
| FR-MARKET-02 | Users can browse, search, filter, and paginate available listings. | Must |
| FR-MARKET-03 | Only an authorized listing owner or Platform Admin can update, deactivate, or moderate a listing. | Must |
| FR-MARKET-04 | Listing availability and expiry are maintained consistently and cannot expose unavailable quantity. | Must |
| FR-MARKET-05 | Listing media is validated and served through protected storage access. | Must |

### 6.4 Orders and reviews

| ID | Requirement | Priority |
|---|---|---|
| FR-ORDER-01 | An eligible buyer can create an order from an available listing with a requested quantity and delivery information. | Must |
| FR-ORDER-02 | The platform computes totals from trusted listing data and preserves the agreed price snapshot. | Must |
| FR-ORDER-03 | An order follows a validated lifecycle from pending through fulfillment, with cancellation only in allowed states. | Must |
| FR-ORDER-04 | Only an order participant or authorized operator can view or change the order according to the lifecycle rules. | Must |
| FR-ORDER-05 | Participants can review one another after successful delivery, subject to one review per participant and order. | Should |

### 6.5 Payments

| ID | Requirement | Priority |
|---|---|---|
| FR-PAY-01 | An eligible buyer can initiate a Chapa checkout for an order using a unique transaction reference. | Must |
| FR-PAY-02 | Payment initialization is idempotent and does not create duplicate payment effects. | Must |
| FR-PAY-03 | Payment success is accepted only after trusted provider verification of reference, amount, currency, and status. | Must |
| FR-PAY-04 | Failed or cancelled payment leaves the order unpaid and safely retryable. | Must |
| FR-PAY-05 | Payment history is durable, auditable, and supports controlled refunds. | Must |
| FR-PAY-06 | Monetary calculations use integer minor units or an equivalent exact representation. | Must |

### 6.6 Notifications and audit

| ID | Requirement | Priority |
|---|---|---|
| FR-NOTIF-01 | The platform delivers templated account, order, payment, review, and security notifications through configured channels. | Must |
| FR-NOTIF-02 | Failed notification delivery is retried safely and remains observable. | Must |
| FR-NOTIF-03 | Users can receive relevant in-app events and see notification state. | Should |
| FR-AUDIT-01 | Sensitive business and security actions record actor type, actor, resource, change summary, timestamp, and correlation information. | Must |
| FR-AUDIT-02 | Audit records are append-only and searchable by authorized Platform Admins. | Must |

### 6.7 WebSocket communication

| ID | Requirement | Priority |
|---|---|---|
| FR-WS-01 | An authenticated client can receive authorized live order and notification events. | Must |
| FR-WS-02 | Authorized order participants can exchange and retrieve persisted order messages. | Should |

### 6.8 AI and ML capabilities

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-01 | An eligible user can submit a supported crop image and receive disease analysis with confidence, treatment guidance, limitations, and traceable model metadata. | Must |
| FR-AI-02 | An eligible user can ask agricultural questions and receive answers grounded in approved knowledge sources or an explicit insufficient-evidence response. | Must |
| FR-AI-03 | A user can request price forecasts and weather intelligence for supported crops and regions, including uncertainty and data freshness. | Must |
| FR-AI-04 | A processor can request quality grading and factory feasibility analysis with assumptions, confidence, and applicable standards. | Should |
| FR-AI-05 | Long-running training, batch inference, and heavy processing execute asynchronously without blocking request handling. | Must |
| FR-AI-06 | AI results record model or prompt version, confidence where applicable, latency, timestamp, input metadata, and review state. | Must |
| FR-AI-07 | Low-confidence or safety-sensitive results can enter a Platform Admin review queue. | Must |
| FR-AI-08 | Human review outcomes are retained for audit, monitoring, and approved retraining workflows. | Should |

### 6.9 Knowledge base

| ID | Requirement | Priority |
|---|---|---|
| FR-KB-01 | Each knowledge source has ownership, source, language, version, publication, approval, and expiry metadata. | Should |
| FR-KB-02 | Only approved and non-expired knowledge is eligible for retrieval. | Must |
| FR-KB-03 | The assistant must not invent agricultural guidance when approved evidence is insufficient. | Must |

### 6.10 Administration and system automation

| ID | Requirement | Priority |
|---|---|---|
| FR-ADMIN-01 | Platform Admin can manage users, listings, orders, payments, AI review, and platform reporting within their authority. | Must |
| FR-ADMIN-02 | Platform Admin actions that change trust, money, access, or content are auditable. | Must |
| FR-SYS-01 | System/AI workers run scheduled expiry, forecast, inference, notification, and reconciliation jobs. | Must |
| FR-SYS-02 | System/AI verifies provider callbacks before changing durable payment state. | Must |
| FR-SYS-03 | System/AI records automated actions with an explicit system or webhook actor type. | Must |
| FR-SYS-04 | System/AI cannot exercise discretionary human privileges such as role changes, suspension, or refunds without an approved operator workflow. | Must |

## 7. User stories

> As a **farmer**, I want to photograph a diseased crop and receive understandable treatment guidance with confidence and limitations.
>
> As a **processor**, I want to find reliable listings and evaluate quality before purchasing raw material.
>
> As a **consumer**, I want to see clear product, seller, order, and payment status before purchasing.
>
> As a **Platform Admin**, I want to see who changed access, money, content, or AI review state and when.
>
> As the **System/AI**, I want to process asynchronous work safely without acquiring human operator privileges.

## 8. Non-functional requirements

### 8.1 Security (SEC)

| ID | Requirement |
|---|---|
| SEC-001 | All traffic is over HTTPS in staging/production; HSTS is enabled. |
| SEC-002 | No secrets are in code or git history; all keys come from environment or a secret manager. |
| SEC-003 | Passwords are hashed with bcrypt (cost >= 12); tokens are hashed at rest. |
| SEC-004 | Rate limiting applies to authentication challenges and public APIs. |
| SEC-005 | Input validation applies at every frontend, platform, AI, provider, and storage boundary. |
| SEC-006 | SQL injection, XSS, and CSRF protections are enabled where applicable. |
| SEC-007 | Payment callbacks are verified and monetary values are recomputed server-side. |
| SEC-008 | Uploaded images are type, size, and content validated and served from protected object storage. |
| SEC-009 | Dependency, secret, and static security scanning runs in CI. |

### 8.2 Performance and scalability (PERF)

| ID | Requirement |
|---|---|
| PERF-001 | CRUD operations meet the documented latency target; AI operations meet model-specific targets. |
| PERF-002 | Listing search uses indexed fields and bounded pagination. |
| PERF-003 | Redis may cache hot reads with explicit, short-lived invalidation rules. |
| PERF-004 | Heavy AI and provider work runs asynchronously so web requests remain responsive. |
| PERF-005 | Stateless platform and AI services can scale horizontally behind a load balancer. |

### 8.3 Availability and reliability (REL)

| ID | Requirement |
|---|---|
| REL-001 | Production API availability target is 99.9%. |
| REL-002 | Each service exposes liveness and dependency readiness signals. |
| REL-003 | Payment events are processed at least once with idempotent handlers. |
| REL-004 | Scheduled jobs recover safely after worker or service restarts. |
| REL-005 | Audit and payment records are durable append-only business data. |

### 8.4 Usability and accessibility (UX)

| ID | Requirement |
|---|---|
| UX-001 | The interface works on low-end Android devices and constrained networks. |
| UX-002 | The interface supports Amharic and English localization, selectable from a language toggle present on every page. The translation layer is structured so further languages can be added without rewriting pages. |
| UX-003 | User-facing errors are understandable and avoid technical jargon. |
| UX-004 | Forms provide inline validation and accessible error summaries. |
| UX-005 | Critical actions show a clear next step and preserve recoverable work. |

### 8.5 Maintainability (MAIN)

| ID | Requirement |
|---|---|
| MAIN-001 | The repository separates frontend, platform backend, AI service, infrastructure, and shared contracts. |
| MAIN-002 | Critical modules have automated unit, integration, contract, and end-to-end coverage appropriate to risk. |
| MAIN-003 | Pull requests pass formatting, type, test, security, and build gates before merge. |
| MAIN-004 | Public and internal contracts are versioned and testable. |

### 8.6 Portability and mobile readiness (MOB)

| ID | Requirement |
|---|---|
| MOB-001 | The public API supports web sessions and mobile-compatible Bearer authentication. |
| MOB-002 | Media upload responses and errors have stable, documented JSON contracts. |
| MOB-003 | Mobile clients can act on stable error codes and status values. |
| MOB-004 | Mobile clients use the platform backend; internal AI services are not exposed directly. |

## 9. Acceptance criteria

| Requirement | Acceptance criterion |
|---|---|
| FR-AUTH-01 | A public registration attempt cannot create a Platform Admin account. |
| FR-USER-03 | A user cannot read or modify another user's protected resource. |
| FR-MARKET-04 | Concurrent orders cannot create negative or oversold listing quantity. |
| FR-PAY-03 | An unverified, forged, stale, or amount-mismatched provider callback cannot mark payment successful. |
| FR-AI-01 | A supported evaluation image returns a documented result range with model metadata and limitations. |
| FR-AI-02 | An answer without approved evidence explicitly reports insufficient evidence. |
| FR-AI-07 | A low-confidence result appears in the authorized human review queue. |
| FR-AUDIT-01 | A sensitive action has an actor, resource, timestamp, and correlation record. |
| FR-SYS-04 | Automated jobs cannot perform discretionary human admin actions. |
| SEC-003 | Stored credentials and reset/session tokens are not plaintext. |

## 10. Traceability map

| Module | Requirements | Design location |
|---|---|---|
| Auth and users | FR-AUTH-01...FR-AUTH-05, FR-USER-01...FR-USER-04 | `03` module design and security sections |
| Marketplace and orders | FR-MARKET-01...FR-MARKET-05, FR-ORDER-01...FR-ORDER-05 | `03` domain model and module design |
| Payments | FR-PAY-01...FR-PAY-06 | `03` payment module and payment sequence |
| Notifications and audit | FR-NOTIF-01...FR-NOTIF-03, FR-AUDIT-01...FR-AUDIT-02 | `03` module design and security controls |
| WebSockets | FR-WS-01...FR-WS-02 | `03` API and module design |
| AI and knowledge | FR-AI-01...FR-AI-08, FR-KB-01...FR-KB-03 | `03`, `06`, and `04` AI sections |
| Administration and automation | FR-ADMIN-01...FR-ADMIN-02, FR-SYS-01...FR-SYS-04 | `03`, `07`, and `08` |
| Quality constraints | SEC-001...SEC-009, PERF-001...PERF-005, REL-001...REL-005, UX-001...UX-005, MAIN-001...MAIN-004, MOB-001...MOB-004 | `03`, `05`, `07`, and `08` |

The requirement prefixes in this table are the canonical IDs used by design, database, AI, testing, and deployment documents.
