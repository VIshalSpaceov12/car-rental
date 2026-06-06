# Car Rental Platform — Demo Delivery Plan (phase-wise)

Demo scope (agreed): **booking spine, both roles** · **Postgres + Prisma (Docker)** ·
**all externals mocked** · **EN + AR with RTL** + white-label brand switcher.

Each phase is a vertical slice (DB → API → mobile + dashboard), ends with passing
gates (typecheck · lint · test) and a demoable result, and is committed when green
(clean, no attribution). Phases are sequential — each depends on the previous.

> This is the **demo** plan. The full-product phasing lives in [PRD.md §13](PRD.md).
> Open client questions are resolved with demo defaults (see PRD §11 / chat).

---

## Phase 0 — Infrastructure & data layer
**Goal:** a running database the API talks to, seeded with demo data.
- `docker-compose.yml` (Postgres 16); `DATABASE_URL` in `apps/api/.env`.
- Prisma: schema for all spine entities, initial migration, seed script.
- Seed: 1 provider (+ branding), 2 branches, ~3 categories, ~6 vehicles, 1 customer
  + 1 provider user, business settings (tax %, currency, rental plans).
- Wire `apps/api` to Prisma (repository layer).

**Entities:** `Provider · User · Branch · VehicleCategory · Vehicle · Booking · Otp ·
Payment · Contract · Rating · BusinessSettings`.

**Exit:** `docker compose up` + `prisma migrate dev` + `prisma db seed` succeed; API
boots connected; a `GET /vehicles` returns seeded vehicles.

## Phase 1 — Auth & identity
**Goal:** both apps log in as seeded users; role-based access works.
- API: `POST /auth/register`, `POST /auth/login` (JWT), `GET /auth/me`; password
  hashing; role guard middleware (customer / service-provider / staff).
- Mobile + dashboard: login/register screens, auth slice (RTK), token persistence.
- `@car-rental/types`: auth request/response contracts.

**Exit:** login on both apps with seeded users; auth **integration tests** pass.

## Phase 2 — Fleet & browsing
**Goal:** provider manages fleet; customer browses it.
- API: provider CRUD `vehicles`, `categories`, `branches`; public browse with filters
  (price, type, transmission, fuel, availability); vehicle detail.
- Dashboard: fleet/category/branch management screens.
- Mobile: browse list + filters, vehicle detail.

**Exit:** vehicle created on dashboard appears in mobile browse + detail.

## Phase 3 — Booking & pricing
**Goal:** customer books; provider accepts; lifecycle is guarded.
- API: `quote` (plan/dates/tax/discount), create booking → `reserved`, role-scoped
  list, provider accept/reject, **guarded** lifecycle transitions (`BookingStatus`).
- Mobile: booking customization (dates, branches, plan) → quote → confirm.
- Dashboard: incoming bookings, accept/reject, set prep time → `vehicle-prepared`.

**Exit:** customer books → provider accepts; **lifecycle transition tests** pass
(illegal transitions rejected).

## Phase 4 — Payments (mock)
**Goal:** pay to confirm a booking, safely.
- API: mock gateway (auto-success) + cash-on-delivery; `pay` → `confirmed`; payment
  records; **no card data stored/logged** (PCI).
- Mobile: checkout summary (base/tax/total), pay (mock card / COD).

**Exit:** pay → `confirmed`; **payment + lifecycle tests** pass.

## Phase 5 — OTP lock-box & contract
**Goal:** keyless pickup and return.
- API: issue OTP (provider) **bound to booking + vehicle + time window**, verify +
  consume + expiry; digital contract sign; return inspection.
- Mobile: OTP display, simulated unlock, sign contract → `picked-up`; return →
  `returned`/`completed`.
- Dashboard: issue/track OTP, monitor pickup/return.

**Exit:** **OTP binding/expiry/consume tests** pass; full pickup → return flow works.

## Phase 6 — Realtime, ratings & history
**Goal:** live status, post-rental actions.
- API: Socket.io rooms (per booking/provider), emit on status change; rating endpoint;
  rental history + receipts.
- Mobile: live status updates, rate vehicle/service, history + receipts.
- Dashboard: live booking board.

**Exit:** dashboard status change reflects live in mobile; rate + history work.

## Phase 7 — i18n (EN + AR) + white-label
**Goal:** the SOW differentiators visible.
- Both apps: `i18next` EN + AR catalogs, language toggle, RTL (`I18nManager` on RN,
  `dir`-aware on web).
- White-label: brand switcher feeding provider branding (logo, colors) into the
  `@car-rental/tokens` `ThemeProvider`.

**Exit:** switch to AR → RTL + translated strings on both apps; switch brand → theme
updates live.

## Phase 8 — Demo polish & verification
**Goal:** a clean, one-command demo.
- Richer seed data; empty/error/loading states; README run instructions + demo
  walkthrough; final green CI; manual run of both apps end-to-end.

**Exit:** documented one-command demo; all gates green; happy path verified by running.

---

## Dependency chain
`0 → 1 → 2 → 3 → 4 → 5 → 6`, then `7` (cross-cutting, layered over all surfaces),
then `8` (polish). Phases 2 and the dashboard/mobile halves within a phase can be
built in parallel where independent.

## Per-phase definition of done
1. Code complete across affected layers (db/api/mobile/dashboard).
2. `npm run typecheck && npm run lint && npm run test` green.
3. Prioritized tests present (OTP, payment, booking-lifecycle per CLAUDE.md).
4. Manually run the new capability once.
5. Commit (clean message, no attribution).
