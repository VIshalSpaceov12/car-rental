# Phase 6 — Realtime, ratings & history

**Goal (DEMO_PLAN §Phase 6):** live status, post-rental actions.

**Status:** implemented across `api`, `dashboard`, `mobile`. Exit criteria met —
a dashboard status change reflects live in mobile; rating + history work.

No Prisma migration (the `Rating` model has existed since Phase 0). No new env
vars. One new dependency: **Socket.io** (already named in the architecture).

## Realtime (Socket.io)

- The Express app is now wrapped in an `http.Server` (`index.ts`) with Socket.io
  attached on the same port via the `realtime` module.
- **Auth:** the handshake carries the JWT (`auth.token`), verified with the same
  `verifyToken` + `getUserById` as REST. Unauthenticated sockets are rejected.
- **Rooms:** on connect a socket joins `user:<userId>`, and providers also join
  `provider:<providerId>`.
- **Emit:** `emitBookingStatus({ bookingId, status, customerId, providerId })` fires
  after every lifecycle transition — pay→confirmed (`payments`), prepare / return /
  complete / reject / cancel (`bookings`), sign→picked-up (`contract`). It targets
  `user:<customerId>` + `provider:<providerId>` with a `booking:status` event. Best
  effort: a null io (e.g. in unit tests) makes it a no-op, and a socket failure
  never breaks the REST request.
- **Clients:** one authenticated connection per session (a `useBookingStatusSocket`
  hook in each app's authed shell). On `booking:status` they
  `invalidateTags(['Booking'])` so the list/board refetches — the payload only says
  *what* changed, not the full new state.

## Ratings

- `POST /bookings/:id/rating` *(customer)* — only when `completed`, customer-owned;
  body `{ vehicleRating 1–5, serviceRating 1–5, comment? }`; one per booking
  (409 on repeat). `GET /bookings/:id/rating` *(customer or owning provider)*.
- Endpoints live in the `bookings` module (next to return/complete); the `Rating`
  model already existed.
- New types `Rating` + `CreateRatingRequest`; realtime contract `BOOKING_STATUS_EVENT`
  + `BookingStatusEvent` in `@car-rental/types`.
- **Mobile:** rate screen (two 1–5 selectors + comment) on completed bookings, then
  shows the submitted rating. **Dashboard:** shows the rating on completed bookings.

## History & receipts (client-side)

No new endpoints — the data already exists.

- **History:** the mobile bookings screen splits into active + "Past rentals"
  (terminal states).
- **Receipts:** rendered from `BookingSummary` already in the list cache (subtotal,
  discount, tax, total, currency, payment status).
- **Re-book:** "Book again" opens the existing booking flow prefilled with the past
  booking's vehicle.

## Decisions

1. **Rooms keyed by `user`/`provider`**, not per-booking — no subscription churn.
2. **Refetch-on-event** (invalidate cache) rather than patching records from the
   socket payload — simpler, avoids drift.
3. **History/receipts/re-book are client-only** — no new endpoints.
4. **Emit from the service layer**, not the repository — keeps the repo free of
   transport concerns; ~6 transition sites call `emitBookingStatus`.

## Testing

- API: rating endpoint (completed-gate, 1–5 validation, one-per-booking, tenancy);
  Socket.io integration tests — an authenticated client receives `booking:status`
  on a customer transition (pay) and a provider transition (prepare), and an
  unauthenticated socket is rejected.
- Clients: rating display (dashboard) and history helpers + i18n parity (mobile).

## Deferred

Real Twilio SMS / FCM push (still mocked); loyalty/rewards, address management,
support tickets (C-12/13/16); full Arabic copy QA (Phase 7).
