# Next.js 14 standalone-ish build. This uses the standard `next build` +
# `next start` flow rather than `output: 'standalone'` so that the runtime
# image can serve the same assets the dev server produces. If the bundle
# size matters later, switching to `output: 'standalone'` in next.config.js
# shaves about 200 MB off the image at the cost of a slightly different
# COPY layout.
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# the build stage must see the same URL the browser will use.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

RUN npm prune --omit=dev

# ---------------------------------------------------------------------------

FROM node:20-alpine AS runtime

RUN addgroup -S app && adduser -S app -G app

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder --chown=app:app /build/node_modules ./node_modules
COPY --from=builder --chown=app:app /build/.next ./.next
COPY --from=builder --chown=app:app /build/public ./public
COPY --from=builder --chown=app:app /build/package.json ./
COPY --from=builder --chown=app:app /build/next.config.js ./

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:3000/ || exit 1

EXPOSE 3000
CMD ["npx", "next", "start"]
