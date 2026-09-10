# Mobile App (placeholder)

Status: **not started**.

The mobile application will consume the same API contract as the current Next.js frontend once the public API surface is stable. Planned clients:

- Farmer: authentication, chat, disease scan, market prices
- Processor: dashboard, equipment, feasibility, quality
- Consumer: dashboard
- Marketplace: browse, listings, orders, payments

Architectural notes for when work begins:

- API base URL is owned by the NestJS backend/service layer, not by the mobile app.
- Authentication should follow the same session/token contract used by the web app.
- Offline behavior, push notifications, and biometric login are future concerns.
- Keep feature parity with the web app as the source of truth until the mobile UX is explicitly redesigned.
