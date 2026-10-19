# Multi-stage: build TypeScript → JS in stage 1, ship the runtime in stage 2.
# The final image is a dist-only runtime with node_modules stripped to prod.
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Strip dev dependencies — the runtime does not need typescript, jest, or the
# nest CLI.
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------

FROM node:20-alpine AS runtime

# Non-root user.
RUN addgroup -S app && adduser -S app -G app

# curl for the HEALTHCHECK.
RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder --chown=app:app /build/node_modules ./node_modules
COPY --from=builder --chown=app:app /build/dist ./dist
COPY --from=builder --chown=app:app /build/package.json ./

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:4000/health || exit 1

EXPOSE 4000
CMD ["node", "dist/main.js"]
