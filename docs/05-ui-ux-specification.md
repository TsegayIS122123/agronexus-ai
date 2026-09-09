# 05 — UI/UX Specification

> AgroNexus AI — A clear, low-bandwidth, multilingual experience for the agricultural value chain.

## 1. Experience goals

The interface must help people make decisions quickly, even on a small Android phone and an unreliable connection. Every screen should answer three questions: what is happening, what can I do next, and what evidence supports the result?

### Design principles

1. **Plain language:** use farmer-friendly labels and explain technical terms.
2. **Action first:** put the next useful action near the result.
3. **Trust visible:** show verification, status, timestamp, source, and AI confidence.
4. **One task per screen:** avoid dense forms and hidden workflows.
5. **Graceful failure:** preserve entered data and explain how to retry.
6. **Local by default:** support Amharic, Oromo, Tigrinya, and English through a translation-ready content layer.

## 2. Information architecture

```text
Public
  Home, About, Solutions, Contact, Marketplace browse
Account
  Register, Login, Verify email, Forgot password, Reset password
Farmer
  Dashboard, Detect disease, Ask assistant, Prices, Listings, Orders, Profile
Processor
  Dashboard, Find supply, Quality, Feasibility, Equipment, Orders, Profile
Consumer
  Browse, Product detail, Checkout, Orders, Profile
Admin
  Users, Listings, Orders, Payments, AI review, Audit logs
```

## 3. Core journeys

### Disease detection

1. Select or capture a crop image.
2. See upload progress and image quality guidance.
3. Receive disease, confidence, model version, treatment guidance, and limitations.
4. Save the result or request human review when confidence is low.

### Marketplace purchase

1. Search by crop, category, region, and price.
2. Inspect seller verification, quality information, quantity, delivery options, and listing date.
3. Create an order with quantity and delivery details.
4. Review server-calculated total and currency.
5. Continue to Chapa sandbox checkout.
6. See payment pending, paid, failed, or retry status.

### Account recovery

1. Request reset using email or phone.
2. Always receive a generic response that does not reveal whether an account exists.
3. Enter a one-time code or link token.
4. Set a new password and receive confirmation on all active sessions being revoked.

## 4. Screen requirements

| Screen | Must show | Important states |
|---|---|---|
| Dashboard | Role-specific actions, recent activity, alerts | First visit, loading, empty, error |
| Disease result | Label, confidence, image, model version, advice, disclaimer | Low confidence, unsupported image, retry |
| Listing detail | Price, unit, quantity, seller, region, quality, status | Expired, unavailable, signed-image failure |
| Checkout | Order summary, amount, currency, payment status | Pending, failed, paid, duplicate attempt |
| Orders | Status timeline, participants, delivery, payment | Empty, cancelled, delayed |
| Admin audit | Actor, action, target, timestamp, correlation ID | No results, restricted access |

## 5. Visual and interaction system

- Use a restrained agricultural palette with strong contrast and one accent color for actions.
- Use a readable sans-serif typeface with full Ethiopic support.
- Use icons with text for unfamiliar actions; do not rely on color alone.
- Keep primary actions stable in size and position.
- Use confirmation dialogs for destructive actions and explicit status labels for payments.
- Use charts only when they support a decision; provide a table or summary for accessibility.

## 6. Accessibility and localization

- Keyboard navigation and visible focus states are required.
- Form errors appear beside the field and in a summary for screen readers.
- Text must resize without clipping at mobile widths.
- Dates, numbers, currency, and units use locale-aware formatting.
- Translation keys live outside components; no user-facing text is hard-coded into business logic.
- Images have meaningful alternative text; decorative images are ignored by assistive technology.

## 7. Frontend security rules

- The browser communicates with NestJS only.
- Access tokens are never stored in `localStorage`.
- Payment status is read from the backend, never inferred from the redirect URL.
- Role-based route guards improve navigation but do not replace backend authorization.
- User-generated text is rendered safely and sanitized where rich text is allowed.
