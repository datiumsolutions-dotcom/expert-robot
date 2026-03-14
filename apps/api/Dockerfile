# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Generate Prisma client
RUN pnpm --filter @loyalty/db generate

# Build
RUN pnpm --filter @loyalty/api build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml ./
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/db ./packages/db
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
