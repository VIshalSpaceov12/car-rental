# notifications module

Outbound delivery: SMS/OTP (Twilio), push (FCM), realtime booking-status
(Socket.io), email.

**Status (Phase 5): mocked.** `notifications.service.ts` exposes `sendOtp()`, which
logs the code instead of calling a gateway — so no provider creds/env are required
yet. The signature is the integration seam: dropping in a real Twilio/FCM client
is a change behind `sendOtp()` that callers never see. Realtime + email are still
unimplemented (Phase 6+).
