# bookings module

Booking quote, creation, and the **guarded** lifecycle (`reserved → confirmed →
vehicle-prepared → picked-up → returned → completed`, + `rejected`/`cancelled`).
The status enum and its allowed-transition graph are owned by `@car-rental/types`
(`BookingStatus` / `BOOKING_TRANSITIONS`); illegal transitions are rejected `409`.

| File | Responsibility |
|------|----------------|
| `booking.pricing.ts` | Pure quote math: days × rate × plan multiplier, discount, tax. |
| `booking.lifecycle.ts` | `canTransition(from, to)` against the authoritative graph. |
| `booking.mappers.ts` | DB row ↔ wire contract (Decimal→number, Date→ISO, enum case). |
| `booking.repository.ts` | Prisma access; tenant-scoped lookups. |
| `booking.service.ts` | Orchestration + `BookingError`; quote / create / list / transition. |
| `booking.routes.ts` | REST + zod validation + auth/role guards. |

## Routes

| Method | Path | Role | Effect |
|--------|------|------|--------|
| POST | `/bookings/quote` | customer | Itemized price, no persistence |
| POST | `/bookings` | customer | Create → `reserved` (amounts recomputed server-side) |
| GET | `/bookings` | any | Tenant-scoped list (customer: own · provider: incoming) |
| POST | `/bookings/:id/reject` | service-provider | `reserved → rejected` |
| POST | `/bookings/:id/prepare` | service-provider | `confirmed → vehicle-prepared` |
| POST | `/bookings/:id/cancel` | customer | `reserved`/`confirmed → cancelled` (refunds a paid payment) |
| POST | `/bookings/:id/provider-cancel` | service-provider | `reserved`/`confirmed → cancelled` (refunds a paid payment) |

**Phase 4** moves the `reserved → confirmed` trigger to **payment** (see the
`payments` module: `POST /payments/:bookingId/pay`) — the provider *accept* action
is removed. The transition graph is unchanged. OTP issuance for keyless pickup
lands in Phase 5.
