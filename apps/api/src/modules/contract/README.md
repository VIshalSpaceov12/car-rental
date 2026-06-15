# contract module

Digital rental contract (Phase 5). Generated lazily from the booking; signing it
drives the keyless pickup transition.

- `GET /contracts/:bookingId` *(customer or owning provider)* — returns the
  contract, materialising its terms text from the booking on first access.
- `POST /contracts/:bookingId/sign` *(customer)* — requires explicit `consent`, a
  `vehicle-prepared` booking, and a **consumed OTP** (the box must have been opened
  first). Records the signature and transitions the booking `vehicle-prepared →
  picked-up`.

Contract terms text is rendered by `contract.content.ts` (pure + deterministic).
