# Car Rental Platform

White-label car rental platform. Customers book vehicles from a mobile app;
service providers manage their branded fleet from a web dashboard. Vehicle access
is **keyless via an OTP lock-box** — no physical key exchange.

## Monorepo layout

npm-workspaces monorepo, single git repo. API contract types live in
`@car-rental/types` and are imported by both clients (never duplicated).

| Workspace | Stack | Role |
|-----------|-------|------|
| `apps/api` | Node/Express + TS (modular monolith) + Prisma | Backend (auth, fleet, bookings, payments, OTP, contracts, ratings, realtime) |
| `apps/dashboard` | React + Vite + TS | Service-provider web dashboard |
| `apps/mobile` | Expo (dev client) RN + TS | Customer app (iOS/Android) |
| `packages/types` | TS | Shared API contracts — the source of truth |
| `packages/tokens` | TS + React | Design tokens + `ThemeProvider`/`useTheme` |

## Prerequisites

- **Node 20+** and npm
- **PostgreSQL 16** running locally (a `car_rental_dev` database)

## Setup

```bash
# 1. Install all workspaces
npm ci

# 2. Configure the API environment
cp apps/api/.env.example apps/api/.env
#   then edit apps/api/.env — set DATABASE_URL to your Postgres, and a JWT_SECRET (≥16 chars)

# 3. Create the schema and seed demo data
npm run db:migrate -w @car-rental/api   # applies migrations
npm run db:seed   -w @car-rental/api    # seeds the demo tenant + lifecycle bookings
```

The seed creates one provider tenant (DemoRent), a fleet, two demo users, and a
spread of bookings across every lifecycle state so the apps open populated.

## Running

```bash
npm run dev:api         # http://localhost:4000
npm run dev:dashboard   # Vite dev server (URL printed in the terminal)
npm run dev:mobile      # Expo dev client (scan the QR / open a simulator)
```

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Customer (mobile) | `customer@demo.test` | `Password123!` |
| Service provider (dashboard) | `provider@demo.test` | `Password123!` |

## Quality gates

```bash
npm run typecheck && npm run lint && npm run test
```

The same gates run in CI (`.github/workflows/ci.yml`) against a Postgres service.
The API test suite migrates and seeds a dedicated `car_rental_test` database
(see `apps/api/.env.test`).

## Demo walkthrough (happy path)

1. **Browse & book (mobile):** sign in as the customer, browse the fleet, pick a
   vehicle, choose dates/branch/plan, review the itemized quote, and create the
   booking.
2. **Pay (mobile):** pay with the mock card (or cash-on-delivery) — payment moves
   the booking `reserved → confirmed`.
3. **Prepare & issue OTP (dashboard):** sign in as the provider, mark the booking
   `vehicle-prepared`, then **Issue OTP** — the 6-digit code is shown to read out.
4. **Keyless pickup (mobile):** enter the OTP to "unlock the box", read and sign
   the digital contract — the booking moves to `picked-up`.
5. **Return (mobile):** return the vehicle (`picked-up → returned`).
6. **Complete & inspect (dashboard):** record the return condition — the booking
   moves to `completed`. Status changes appear **live** on both apps via Socket.io.
7. **Rate & history (mobile):** rate the completed rental; view it under
   **Past rentals** with its receipt, and re-book in a tap.
8. **i18n + white-label:** switch the language to **العربية** (RTL) from settings,
   and edit the provider's **brand colors** on the dashboard — the theme updates
   live across the apps.

## Documentation

- `CLAUDE.md` — architecture, conventions, product constraints
- `docs/PRD.md` — product requirements
- `docs/DEMO_PLAN.md` — phased delivery plan
- `docs/phase-*.md` — per-phase design notes
