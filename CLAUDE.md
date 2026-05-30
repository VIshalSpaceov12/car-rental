# Car Rental Platform — CLAUDE.md

White-label car rental platform (client: Nael Mattar, SOW v1.0 / 2025-08-07). Service providers run their own branded fleets; customers book via mobile, providers manage via web dashboard. Vehicle access is **keyless via OTP lock-box** — no physical key exchange (the core access mechanism).

## Architecture

**npm-workspaces monorepo**, single git repo. REST + JWT (multi-role auth) between apps. No build orchestrator — workspace packages ship TS source; each app's toolchain (tsx / Vite / Metro) transpiles it.

| Workspace | Stack | Role |
|-----------|-------|------|
| `apps/api` | Node/Express + TS (modular monolith) | Backend; domain modules (auth, bookings, payments, fleet, notifications), extract to services later if needed |
| `apps/dashboard` | React + Vite + TS | Service-provider web dashboard |
| `apps/mobile` | Expo (dev client) RN + TS | Customer app (iOS/Android) |
| `packages/types` | TS | Shared API contracts — the source of truth |
| `packages/tokens` | TS + React | Design tokens + `ThemeProvider`/`useTheme` |

Monorepo ⇒ **API contract types live in `@car-rental/types` and are imported, not duplicated** — change a shape once, both clients see it.

## Two roles only

- **Customer** (mobile): register → browse fleet → customize booking (dates/branch/plan) → pay → receive OTP → keyless pickup → return → optional rating.
- **Service Provider** (dashboard): fleet catalog & categories, pricing/availability, accept/reject bookings, generate/track OTPs, branches, staff, payments, analytics, support.

## Tech defaults

- **TS strict** everywhere, avoid `any`. Functional components + hooks only (no classes).
- **Mobile:** Expo (dev client) RN + React Navigation. **Web:** React + Vite.
- **State:** Redux Toolkit (complex flows) / Context (local) — same split on mobile and web.
- **Backend:** Express, RESTful, **modular monolith** — domain modules with clean boundaries (route → controller → service → repository), extractable to services later. `tsx` for dev.
- **DB:** PostgreSQL + Prisma; each microservice owns its schema. Relational integrity is critical for bookings/payments/financial records.
- **Payments:** Stripe / PayPal / local gateways + cash-on-delivery. PCI — never log or persist raw card data.
- **Realtime/infra:** Socket.io (booking status); Twilio/FCM (OTP + push); Google Maps (branches, pickup/drop-off); S3/Cloudinary (images & docs); containerized cloud hosting (AWS/GCP/Azure) + CI/CD.

## Non-negotiable product constraints

- **OTP lock-box** is core and security-sensitive: bind OTP to booking + vehicle + time window. Flow: booking confirmed → OTP issued pre-pickup → unlock box → digital contract signing → return inspection.
- **i18n AR + EN.** Arabic is RTL — build RTL-aware from the start (logical props, `I18nManager` on RN); never hardcode LTR or copy strings.
- **White-label:** branding (logo, colors, app name, copy) is config-driven per provider, never hardcoded.
- **Flexible rental plans:** daily / weekly / monthly / long-term with dynamic + seasonal pricing.

## Design system

- **Centralized typed tokens** — color, spacing, typography, radii, z-index/elevation in one `as const` module with a `Theme` type (a missing `color.danger` is a compile error); components never inline a hex/px/font — lint-enforce so a raw `#fff` or `16` fails CI.
- **Semantic, not literal** — name by role (`color.primary`, `spacing.md`), never `blue500`. A private primitive scale feeds the semantic layer; components touch only semantics, so a provider overrides `color.primary` without touching the scale.
- **Static vs themeable** — spacing, type scale, radii are static; colors, logo, brand assets are themeable, so a reskin doesn't disturb layout primitives. Light/dark is just another themeable color set.
- **Runtime theming** — resolve semantic tokens through the active provider via `ThemeProvider` + `useTheme()`; never import color tokens directly. One binary serves many brands.
- **Shared `@car-rental/tokens`** — workspace package consumed by mobile + dashboard (no publish/version step). Exports framework-agnostic values + `ThemeProvider`/`useTheme`; apps apply them (RN styles vs web CSS) since elevation ≠ box-shadow.
- **RTL via logical props only** — `start`/`end`, `marginInline`, `paddingStart/End`; never `left`/`right`. RN drives direction with `I18nManager`, web with `dir`-aware containers. Test EN + AR on every layout change.
- **Component layers** — primitives (`Button`, `Text`, `Input`) → composed (`CarCard`, `BookingSummary`) → screens; each layer knows only the one below. Thin screens compose (data/nav/layout; logic in hooks); props-driven theming (no literals — a hardcoded color silently ships wrong branding); variants over copy-paste.
- **One UI vocabulary across repos** — mobile and dashboard share component names and prop contracts (`<Button variant="primary" size="md">`) despite platform-specific impl.

## Booking lifecycle (status model)

`reserved → confirmed → vehicle-prepared → picked-up → returned → completed` (+ `rejected` / `cancelled`). Provider drives transitions; customer sees real-time status. Keep this enum authoritative on the backend.

## Workflow

- No `git commit` / `push` unless asked. Show a plan before large refactors or new deps. Package manager: **npm workspaces** (`npm run <script> -w @car-rental/<app>`).
- **Backend changes:** call out needed Prisma migrations + new env vars (gateway keys, Twilio, FCM, Maps, S3) explicitly.
- **Testing:** unit + integration + e2e — cover OTP, payment, and booking-lifecycle paths first.

## Working principles

Bias toward caution over speed; use judgment on trivial tasks.

- **Think before coding.** State assumptions; if uncertain, ask. Surface multiple interpretations instead of silently picking one; name what's confusing.
- **Simplicity first.** Minimum code that solves the problem, nothing speculative — no unrequested abstractions, flexibility, or error handling for impossible cases.
- **Surgical changes.** Touch only what the request requires; don't refactor working adjacent code; match existing style. Clean up only orphans *your* change created; flag pre-existing dead code, don't delete it.
- **Goal-driven execution.** Turn tasks into verifiable goals ("fix the bug" → "failing test, then make it pass"). For multi-step work, state a brief plan with a verify-step each, then loop until verified.
