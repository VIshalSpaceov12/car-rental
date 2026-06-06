# Car Rental Platform — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | White-label Car Rental Platform (mobile + web) |
| **Client** | Nael Mattar |
| **Source** | Scope of Platform Document, SOW v1.0 (2025-08-07) |
| **PRD version** | 0.1 (draft) |
| **Status** | Foundation scaffolded; feature build not started — see §13 |

> This PRD translates the SOW into buildable requirements. Where the SOW left
> options, it records the decision made for this project (see [CLAUDE.md](../CLAUDE.md)):
> **npm-workspaces monorepo, PostgreSQL + Prisma, Expo (RN), React + Vite,
> Node/Express modular monolith.**

---

## 1. Overview

A comprehensive **white-label** solution that lets a car-rental service provider
run their own branded rental operation. Customers browse and book vehicles from a
branded mobile app; the provider manages the entire operation (fleet, pricing,
bookings, branches, staff, finances) from a web dashboard. Vehicle handover is
**keyless via an OTP lock-box** — no physical key exchange at pickup.

One codebase serves many providers; branding (logo, colors, app name, copy) is
configuration, not a fork.

## 2. Goals & success metrics

| Goal | Metric (target to be set with client) |
|---|---|
| Frictionless booking | Time from app open → confirmed booking; checkout completion rate |
| Keyless operations | % pickups completed via OTP with no staff key handoff |
| Provider self-service | % fleet/pricing/booking actions done by provider without support |
| Reusable platform | New provider onboarded (branding + fleet) with no code change |
| Reliability | API uptime; booking/payment success rate; OTP delivery success rate |

## 3. Personas / roles

The platform has **two primary roles** plus a provider-side sub-role:

- **Customer** (mobile) — browses, books, pays, picks up via OTP, returns, rates.
- **Service Provider** (web dashboard) — owns fleet, pricing, bookings, branches,
  finances, analytics, support. Full operational control.
- **Staff** (web dashboard, scoped) — provider employees with assigned roles/permissions
  for day-to-day operational tasks.

## 4. Scope

### In scope (v1, per SOW)
Customer mobile app, provider web dashboard, REST API, OTP lock-box flow, multi-role
auth, payments (cards + cash-on-delivery), flexible rental plans + dynamic/seasonal
pricing, branches/locations, real-time booking status, notifications (push/SMS), AR+EN
i18n with RTL, white-label theming, analytics/reporting, staff management.

### Out of scope (v1, unless later agreed)
- Native lock-box hardware/firmware (platform issues/validates OTPs; physical lock-box
  integration contract is **TBD** — see §11 open questions).
- Marketplace/multi-provider customer discovery (each provider app is single-brand).
- Customer-to-customer or peer-to-peer rentals.
- Accounting/ERP integration beyond payment-gateway reconciliation.

## 5. Functional requirements — Customer (mobile)

Each item: **requirement** + **acceptance criteria**. IDs `C-*`.

### C-1 Registration & authentication
Secure registration/login with social (Google, Apple, Facebook) or phone/email + verification.
- [ ] User can sign up via email/phone or a social provider.
- [ ] Email/SMS verification completes before account is active.
- [ ] Login issues a JWT; sessions persist across app restarts; logout revokes locally.
- [ ] Profile holds contact details, payment preferences, and driving-license details.

### C-2 Vehicle browse & search
Browse by category with search + filters.
- [ ] Vehicles listed by category with images and price.
- [ ] Filter by price, vehicle type, transmission, fuel type, availability.
- [ ] Search returns only vehicles bookable for the selected dates/branch.

### C-3 Vehicle details & specifications
- [ ] Detail screen shows images, specs, pricing, features, and rental terms.

### C-4 Booking customization
- [ ] Select rental dates, pickup/drop-off locations, and scheduling options.
- [ ] Apply a rental plan (see C-5) and discount codes before checkout.

### C-5 Flexible rental plans
- [ ] Daily / weekly / monthly / long-term options selectable.
- [ ] Price reflects the chosen plan plus dynamic + seasonal pricing.

### C-6 Pickup & drop-off options
- [ ] Choose pickup and drop-off from available branches.
- [ ] Locations shown on a map; scheduling options available.

### C-7 Streamlined checkout
- [ ] Review booking summary (vehicle, dates, plan, branches, extras).
- [ ] Select optional extra services.
- [ ] See itemized pricing: base, taxes, service charges before paying.

### C-8 Payment processing
- [ ] Pay by credit/debit card via gateway, or choose cash-on-delivery.
- [ ] Card data never touches our servers/logs (PCI — tokenized via gateway).
- [ ] Failed payment leaves the booking in an unpaid/abandoned state, not confirmed.

### C-9 OTP-based vehicle access *(core, security-sensitive — see §9)*
- [ ] After confirmation, customer receives an OTP before pickup.
- [ ] OTP unlocks the lock-box; customer signs the digital contract at pickup.
- [ ] Keyless pickup with no staff key exchange.

### C-10 Real-time booking tracking
- [ ] Customer sees live status from confirmation → vehicle prepared → picked-up → returned.
- [ ] Status updates push in real time (no manual refresh).

### C-11 Rental history & receipts
- [ ] View complete past rentals; re-book a previous vehicle in fewer steps.
- [ ] Download/view receipts and digital contracts.

### C-12 Loyalty & rewards
- [ ] Earn/view provider-specific loyalty points tied to completed rentals.

### C-13 Address management
- [ ] Save multiple pickup/drop-off addresses; set a preferred location.

### C-14 Notifications
- [ ] Push for booking confirmation, OTP delivery, vehicle availability, payment alerts, promotions.

### C-15 Digital documentation
- [ ] Access digital contracts, rental agreements, and receipts in-app.

### C-16 Emergency / support
- [ ] Access emergency contact info and support during the rental period (email/contact provider).

## 6. Functional requirements — Service Provider (web)

IDs `P-*`.

### P-1 Admin authentication & dashboard
- [ ] Secure provider login (multi-role).
- [ ] Dashboard shows booking overview, fleet status, revenue metrics, operational insights.

### P-2 Fleet catalog management
- [ ] Add/edit/delete vehicles with images, specs, pricing, availability, maintenance schedule.

### P-3 Vehicle category management
- [ ] Create/manage categories (economy, luxury, SUV, …), subcategories, fleet organization.

### P-4 Real-time booking processing
- [ ] View incoming bookings; accept/reject; set vehicle preparation time; manage workflow.

### P-5 Booking management system
- [ ] Manage the full lifecycle (reserve → completed) with status tracking and customer messaging.

### P-6 OTP management *(see §9)*
- [ ] Generate/track OTPs per booking; monitor pickup/return activity.

### P-7 Branch & location management
- [ ] Manage branches, operating hours, pickup/drop-off zones, location-specific inventory.

### P-8 Pricing & revenue management
- [ ] Configure dynamic pricing, seasonal rates, promos, discount codes; track revenue.

### P-9 Fleet maintenance tracking
- [ ] Track maintenance schedules, service history, inspection records, vehicle condition.

### P-10 Customer account management
- [ ] View customer profiles, rental history; manage the customer database.

### P-11 Business settings configuration
- [ ] Configure operating hours, service areas, minimum rental periods, cancellation policy, T&Cs.

### P-12 Payment & financial management
- [ ] Process payments, manage transactions, track status, handle refunds, maintain financial records.

### P-13 Marketing & promotions
- [ ] Create discount codes, campaigns, loyalty programs, push + email marketing.

### P-14 Analytics & reporting
- [ ] Revenue reports, fleet-utilization analytics, customer insights, popular-vehicle analysis, operational metrics.

### P-15 Customer support management
- [ ] Handle inquiries, manage support tickets, process complaints, keep communication logs.

### P-16 Platform configuration *(white-label — see §8)*
- [ ] Configure branding elements, notification preferences, app customization, operational params.

### P-17 Insurance & documentation
- [ ] Manage insurance policies, vehicle registration docs, permits, compliance documentation.

### P-18 Staff management
- [ ] Manage staff accounts, assign roles/permissions, track activity, assign operational tasks.

## 7. Key user flows

**Customer:** download → register → verify → complete profile → browse fleet →
select vehicle → set dates/branches → choose plan + discounts → review pricing →
pay → receive confirmation → receive OTP → unlock lock-box + sign contract →
rental period (support available) → return + inspection → completion + receipt →
rate → (re-book from history).

**Service Provider:** secure login → business/branding setup → build fleet catalog
(categories, vehicles, pricing) → configure branches + payment gateways + policies →
receive booking → validate → accept/reject → manage OTP → coordinate vehicle prep →
track to return → handle support → run marketing → review financials/analytics →
manage staff.

## 8. Booking lifecycle (authoritative state model)

`reserved → confirmed → vehicle-prepared → picked-up → returned → completed`
plus terminal `rejected` and `cancelled`.

- [ ] Provider drives transitions; customer sees them in real time.
- [ ] The enum is owned by the backend (`@car-rental/types` → `BookingStatus`) and is
      the single source of truth; clients never invent status strings.
- [ ] Illegal transitions are rejected server-side (e.g. cannot `complete` before `returned`).

## 9. OTP lock-box requirements (NON-NEGOTIABLE / security-sensitive)

- [ ] An OTP is **bound to booking + vehicle + time window** — never a bare reusable code.
- [ ] Flow: booking confirmed → OTP issued **pre-pickup** → OTP unlocks box → digital
      contract signed → return inspection.
- [ ] OTPs expire at the end of the window and on use; verification is server-authoritative.
- [ ] OTP issuance/verification events are auditable.
- [ ] OTP delivery via SMS (Twilio) and/or push (FCM); delivery failures are surfaced.
- [ ] **Open:** physical lock-box hardware integration contract (BLE vs keypad vs vendor API) — §11.

## 10. Non-functional requirements

### 10.1 Internationalization (AR + EN)
- [ ] Full Arabic + English; Arabic is **RTL**.
- [ ] RTL-aware layouts from the start (logical props, `I18nManager` on RN, `dir`-aware web).
- [ ] No hardcoded copy; all user-facing strings localized.

### 10.2 White-label
- [ ] Branding (logo, colors, app name, copy) is config-driven per provider — no code fork.
- [ ] Theming resolves at runtime via the shared `@car-rental/tokens` `ThemeProvider`/`useTheme`.
- [ ] One binary/app shell serves multiple brands.

### 10.3 Security & compliance
- [ ] JWT-based multi-role access control; least-privilege per role/staff permission.
- [ ] PCI: never log or persist raw card data; tokenize via gateway.
- [ ] Data encryption in transit (TLS) and at rest for sensitive fields.
- [ ] Audit trail for OTP, payments, and booking-state changes.

### 10.4 Realtime, performance, scalability
- [ ] Real-time booking status via Socket.io.
- [ ] Cloud-hosted, containerized, horizontally scalable; CI/CD pipeline.
- [ ] Optimized DB schema for fast queries and relational integrity (bookings/payments).

### 10.5 Quality / testing
- [ ] Unit + integration + e2e; **OTP, payment, and booking-lifecycle paths covered first**.

## 11. Assumptions, risks & open questions

| # | Item | Type | Owner |
|---|---|---|---|
| 1 | Physical lock-box: hardware/vendor + access mechanism (BLE/keypad/API) | **Open** | Client |
| 2 | Local payment gateways to support (region-specific) + currencies | **Open** | Client |
| 3 | Loyalty rules (earn/burn rates, expiry) | **Open** | Client |
| 4 | Tax/VAT rules per region; invoice/legal requirements | **Open** | Client |
| 5 | Cancellation/refund policy specifics (windows, fees) | **Open** | Client |
| 6 | Driving-license verification depth (manual vs KYC provider) | **Open** | Client |
| 7 | Multi-provider tenancy model: one app build per provider vs runtime brand switch | Assumption | Team |
| 8 | Microservices deferred; starting as modular monolith with extractable boundaries | Decision | Team |

## 12. Technical architecture (summary)

Full detail in [CLAUDE.md](../CLAUDE.md). npm-workspaces monorepo:

| Layer | Tech |
|---|---|
| Mobile (customer) | Expo (dev client) React Native + TS, React Navigation, Redux Toolkit/Context |
| Web (provider) | React + Vite + TS, Redux Toolkit/Context |
| Backend | Node/Express + TS, **modular monolith** (auth, bookings, payments, fleet, notifications), REST + JWT |
| Database | PostgreSQL + Prisma (relational integrity for bookings/payments) |
| Shared | `@car-rental/types` (API contracts), `@car-rental/tokens` (design system) |
| Payments | Stripe / PayPal / local gateways + cash-on-delivery |
| Realtime / infra | Socket.io; Twilio + FCM (OTP/push); Google Maps; S3/Cloudinary; containerized cloud + CI/CD |

**External services / env vars** (provisioned during backend cycle): `DATABASE_URL`,
`JWT_SECRET`, Stripe/PayPal keys, `TWILIO_*`, `FCM_*`, `GOOGLE_MAPS_API_KEY`,
S3/Cloudinary creds.

### High-level data entities
`User` (role, locale) · `Provider` (branding, settings) · `Branch` · `Vehicle`
(category, specs, pricing, availability) · `Booking` (status, plan, dates, amounts) ·
`Payment` (status, gateway ref) · `Otp` (booking+vehicle+window) · `Contract` ·
`Rating` · `LoyaltyAccount` · `StaffMember` (permissions) · `SupportTicket`.

## 13. Delivery status & roadmap

**Current status (as of this PRD):**
- ✅ **Foundation / skeleton** — monorepo, both app shells boot, shared `types` +
  `tokens` wired, tooling (TS strict, ESLint, Prettier, CI), `api` `/health`. All
  typecheck/lint/test gates green; api boots; dashboard builds; mobile bundles.
  Committed (`1510e82`) and pushed to `main`.
- 🚧 **Uncommitted:** mobile→api `/health` integration (`apps/mobile/App.tsx`, `apps/mobile/src/api.ts`).
- ⬜ Everything in §5–§9 is **not started**.

**Proposed phased roadmap** (each phase = its own spec → plan → build):

1. **Backend foundation** — Prisma schema + migrations for core entities, JWT auth
   (C-1/P-1), env/secrets, error/validation middleware. *Gate: auth + DB e2e.*
2. **Fleet & catalog** — P-2/P-3/P-7 + customer browse/details (C-2/C-3).
3. **Booking core** — customization, plans, pricing, checkout, lifecycle (C-4–C-7, P-4/P-5/P-8/P-11).
4. **Payments** — gateway + COD, refunds, financial records (C-8, P-12). *PCI review.*
5. **OTP lock-box** — issuance/verification, contract signing, return inspection (C-9, P-6). *Security review.*
6. **Realtime & notifications** — Socket.io status, Twilio/FCM (C-10, C-14).
7. **Engagement & ops** — history/loyalty/addresses/support/docs (C-11–C-16), provider
   analytics/marketing/maintenance/staff/insurance (P-9/P-10/P-13–P-18).
8. **i18n + white-label hardening** — AR/EN/RTL pass and per-provider theming across all surfaces.

> i18n, white-label, and security are **cross-cutting** — built into each phase, not bolted on at the end.

## 14. Traceability

Every SOW feature maps to a requirement ID above: SOW "Customer Features" → §5 (`C-*`),
"Service Provider Features" → §6 (`P-*`), "Detailed User Flow" → §7, "Technical
Structure / Development Approach" → §12, non-functional callouts (multi-language,
white-label, security, testing) → §10.
