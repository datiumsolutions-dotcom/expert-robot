# Loyalty SaaS for Restaurants

A multi-tenant restaurant loyalty management platform built as a production-ready monorepo.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express, TypeScript |
| Frontend | Next.js 14, React, TypeScript |
| Database | PostgreSQL 16 (Prisma ORM) |
| Queue | BullMQ + Redis |
| Auth | JWT RS256 |
| Storage | S3-compatible |

## Project Structure

```
expert-robot/
├── apps/
│   ├── api/          # Express REST API → http://localhost:4000
│   └── web/          # Next.js 14      → http://localhost:3000
├── packages/
│   ├── db/           # Prisma schema + migrations (@loyalty/db)
│   ├── types/        # Shared TypeScript types (@loyalty/types)
│   └── utils/        # Shared utilities (@loyalty/utils)
└── infra/
    └── .env.docker   # Docker environment variables
```

## Quick Start (Docker)

```bash
# 1. Copy and populate env file
cp infra/.env.docker.example infra/.env.docker
# Edit infra/.env.docker and fill in JWT_PRIVATE_KEY + JWT_PUBLIC_KEY

# 2. Generate RSA keys
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Copy key contents (with \n) into infra/.env.docker

# 3. Start all services
docker-compose up --build

# 4. Run database migrations
docker-compose exec api npx prisma migrate deploy

# 5. (Optional) Seed demo data
docker-compose exec api node -e "require('./apps/api/dist/...')"
```

## Local Development (without Docker)

```bash
# Prerequisites: Node.js 20, pnpm 8+, PostgreSQL, Redis

# Install
pnpm install

# Env setup
cp .env.example .env
# Edit .env and set DATABASE_URL, REDIS_URL, JWT keys

# Generate Prisma client + migrate
pnpm db:generate
pnpm db:migrate

# Run services in parallel
pnpm dev
```

## API Routes

All routes prefixed `/api/v1/`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Admin login |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/customers` | JWT | List customers |
| POST | `/customers` | JWT | Create customer |
| GET | `/orders` | JWT | List orders |
| POST | `/orders` | JWT | Record order |
| GET | `/rewards` | JWT | List rewards |
| POST | `/rewards` | JWT | Create reward |
| POST | `/redemptions` | JWT | Create redemption |
| POST | `/import/orders` | JWT | Enqueue import job |
| GET | `/audit` | JWT | Query audit log |

## Frontend Pages

**Customer Club** (`/club/...`)
- `/club` — Landing
- `/club/verify` — OTP verification (placeholder)
- `/club/dashboard` — Points & stats
- `/club/rewards` — Available rewards
- `/club/history` — Transaction history

**Admin Portal** (`/admin/...`)
- `/admin/login` — Admin login
- `/admin/dashboard` — Overview
- `/admin/customers` — Customer management
- `/admin/orders` — Order list
- `/admin/rewards` — Reward management
- `/admin/redemptions` — Redemption tracking

## Multi-Tenancy

Every API request extracts `organization_id` from the JWT and scopes all database queries to that organization. Middleware chain: `authenticate` → `orgIsolation` → route handler.

## Testing

```bash
pnpm test
```

## Environment Variables

See `.env.example` for all required variables.
