# Phase 5 — OTP lock-box & contract

**Goal (DEMO_PLAN §Phase 5):** keyless pickup and return. Issue an OTP bound to
booking + vehicle + time window, verify/consume/expire it, sign a digital
contract, and run the return inspection.

**Status:** implemented across `api`, `dashboard`, `mobile`. Exit criteria met —
OTP binding/expiry/consume tests pass and the full pickup → return flow works.

## Lifecycle wiring

Phase 5 fills the three previously-unwired edges of `BOOKING_TRANSITIONS`
(the enum/graph in `@car-rental/types` was unchanged):

```
reserved →(pay)→ confirmed →(provider prepare)→ vehicle-prepared
   → picked-up      OTP verified (box unlocked) + contract signed
   → returned       customer initiates return
   → completed      provider confirms return + records inspection
```

## API

Modular-monolith modules (route → service → repository), mounted in `app.ts`.

**`otp` module** (`apps/api/src/modules/otp`)
- `POST /otps/:bookingId/issue` *(service-provider)* — booking must be tenant-owned
  and `vehicle-prepared`. Generates a 6-digit code via `crypto.randomInt`, stores
  **only the bcrypt hash**, `expiresAt = booking.endAt`, binds `vehicleId`.
  Re-issue replaces any prior code. Returns the plaintext **once** (mock delivery).
- `POST /otps/verify` *(customer)* — server-authoritative: enforces booking+vehicle
  binding, expiry, one-time consume, and a 5-attempt cap. A match consumes the OTP.
  Failures return `{ valid: false }` with no detail. Does **not** move the booking.
- `GET /otps/:bookingId` *(service-provider)* — status tracking
  (`issued`/`consumed`/`expired`); never returns the code.

**`contract` module** (`apps/api/src/modules/contract`)
- `GET /contracts/:bookingId` *(customer or owning provider)* — lazily materialises
  the terms text from the booking (`contract.content.ts`, pure + deterministic).
- `POST /contracts/:bookingId/sign` *(customer)* — requires explicit consent, a
  `vehicle-prepared` booking, and a **consumed OTP** (proof the box was opened).
  Records the signature and drives `vehicle-prepared → picked-up`.

**bookings module** (return/complete live next to `prepare`)
- `POST /bookings/:id/return` *(customer)* — `picked-up → returned`.
- `POST /bookings/:id/complete` *(service-provider)* — `returned → completed`,
  persists a `ReturnInspection` (condition + notes).
- `GET /bookings/:id/inspection` *(service-provider)* — read the recorded inspection.

**`notifications` module** — `sendOtp()` is a **mock** (logs instead of calling a
gateway). The signature is the integration seam for real Twilio/FCM later.

## Data model (migration `phase5_otp_contract_return`)

- `Otp.failedAttempts Int @default(0)` — verify attempt cap.
- `Contract.signerName String?`, `Contract.signedConsent Boolean @default(false)`.
- new `ReturnInspection` (`bookingId @unique`, `condition` enum
  `CLEAN|MINOR_DAMAGE|MAJOR_DAMAGE`, `notes?`, `inspectedAt`, `inspectorId` → User).

## Shared types (`@car-rental/types`)

Extended `otp.ts` (`OtpStatus`, `OtpSummary`); new `contract.ts` (`Contract`,
`ContractSignRequest`) and `return.ts` (`ReturnCondition`, `CompleteBookingRequest`,
`ReturnInspection`).

## Clients

- **Mobile (customer):** a pickup flow off `vehicle-prepared` bookings — enter the
  OTP (received out-of-band) → verify → read + sign the contract → `picked-up`; and
  a "Return vehicle" action on `picked-up` bookings. RTK Query, `useTheme`, EN+AR.
- **Dashboard (provider):** per-booking Phase-5 actions — "Issue OTP" (shows the
  code + expiry + tracked status), view contract, and "Complete & inspect"
  (condition + notes) on `returned` bookings, with the recorded inspection shown
  on `completed` bookings.

## Decisions

1. **OTP + delivery mocked** (code in the issue response + a stub log) — mirrors the
   Phase-4 mock payments. No Twilio/FCM, **no new env vars** this phase.
2. **`picked-up` is triggered by contract-sign, gated on a consumed OTP** — matches
   the PRD order (unlock → sign), not OTP-verify alone.
3. **Customer enters the OTP** on mobile; no endpoint returns the plaintext to the
   customer (the code is delivered out-of-band — security).
4. **Return inspection kept minimal** (condition enum + notes); customer initiates
   the return, provider completes it. No photo upload (S3 deferred).
5. **Lightweight audit / rate-limit** — OTP timestamps + a fixed attempt cap; no
   separate audit table.

## Deferred

Real Twilio SMS / FCM push delivery; physical lock-box hardware integration
(BLE/keypad/vendor API); return photos (S3); realtime status push (Socket.io,
Phase 6); full Arabic copy QA (Phase 7).
