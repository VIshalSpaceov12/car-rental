# Phase 8 — Demo polish & verification

**Goal (DEMO_PLAN §Phase 8):** a clean, one-command demo.

**Status:** done. No migration, no env vars, no new deps.

## Richer seed data

`apps/api/prisma/seed.ts` previously seeded only the tenant, fleet, and two users —
every screen opened empty. It now also seeds a spread of bookings (under the demo
customer, on non-`veh-corolla` vehicles with near-now dates so they never collide
with the integration tests), so both apps open populated:

| Booking | Vehicle | State | Extras |
|---------|---------|-------|--------|
| `bk-reserved` | Model 3 | reserved | — (unpaid; mobile can pay) |
| `bk-confirmed` | Sunny | confirmed | paid |
| `bk-prepared` | RAV4 | vehicle-prepared | paid (provider can issue OTP) |
| `bk-pickedup` | Patrol | picked-up | paid + signed contract |
| `bk-completed` | E-Class | completed | paid + contract + inspection + rating |

All upserts are idempotent (fixed ids); re-seeding also **resets the demo brand**
(name/logo/colors), so a demo always starts from a known state even after a
branding edit.

## Empty / loading / error states

Audited the primary list screens and filled genuine gaps (the rest already
handled their states):
- **Mobile browse:** real `ActivityIndicator` while loading; an error state with a
  retry button (previously a failed fetch fell through to "no vehicles"); the
  filter stays reachable from the empty state.
- **Mobile bookings:** retry button on error; friendlier empty copy; a "no active
  rentals" line when only past rentals exist.
- **Dashboard fleet:** loading / error / empty states for the vehicle table.
- **Dashboard bookings:** already complete — left as-is.

New strings added to both EN and AR catalogs (parity tests green).

## README + walkthrough

Added a root `README.md`: prerequisites, one-command setup (install → configure env
→ migrate → seed), how to run each app, demo credentials, the quality-gate command,
and a step-by-step happy-path walkthrough (browse → book → pay → prepare → OTP →
contract → pickup → return → complete → rate, plus language switch + branding edit).

## Verification

- **Gates:** `npm run typecheck && npm run lint && npm run test` — all green
  (api 139, dashboard 30, mobile 19, types 6, tokens 6). CI runs the same against a
  Postgres service.
- **Manual run (happy path, against the live server):** booted the API + dashboard;
  confirmed health, customer/provider auth, the seeded lifecycle bookings list,
  OTP issue → verify, the seeded rating, and a live `PATCH /branding` brand update;
  the dashboard Vite app serves. Mobile is covered by the typecheck/lint/test gate.

## Notes

This phase is intentionally light on new tests — it adds seed data (config),
presentational empty states, and docs. The full gate plus the manual run are the
verification. Phases 0–8 of the demo plan are now complete.
