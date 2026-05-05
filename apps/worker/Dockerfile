# syntax=docker/dockerfile:1.7
# Worker — Node.js + BullMQ. Run via `tsx` directly, no bundling.

# ---------- deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY apps/worker/package.json apps/worker/pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10 --activate \
    && pnpm install --frozen-lockfile

# ---------- builder ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/worker/package.json apps/worker/pnpm-lock.yaml apps/worker/tsconfig.json ./
COPY apps/worker/src ./src
# Copy schema content (not the symlink) from the source of truth
COPY apps/web/prisma/schema.prisma ./prisma/schema.prisma
RUN corepack enable && corepack prepare pnpm@10 --activate \
    && pnpm prisma generate

# ---------- runner ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app
ENV NODE_ENV=production \
    LOG_LEVEL=info
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 worker

COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/package.json ./package.json
COPY --from=builder --chown=worker:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=worker:nodejs /app/src ./src
COPY --from=builder --chown=worker:nodejs /app/prisma ./prisma

USER worker
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs", "src/index.ts"]
