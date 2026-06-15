# otp module

Keyless lock-box OTPs (Phase 5). An OTP is **bound to a booking + its vehicle**,
expires at the end of the rental window, and is stored **only as a bcrypt hash** —
the plaintext is returned once at issuance (mock delivery) and never persisted.

- `POST /otps/:bookingId/issue` *(provider)* — issue a code for a `vehicle-prepared`
  booking. Re-issue replaces any prior code.
- `POST /otps/verify` *(customer)* — server-authoritative check: enforces the
  booking + vehicle binding, expiry, one-time consume, and an attempt cap
  (`MAX_FAILED_ATTEMPTS`). A match consumes the code; failures return
  `{ valid: false }` with no detail. This is the "unlock the box" step.
- `GET /otps/:bookingId` *(provider)* — status tracking (`issued`/`consumed`/`expired`);
  never returns the code.

Verifying the OTP does **not** move the booking — signing the contract does (see
the `contract` module). Delivery is mocked via the `notifications` module.
