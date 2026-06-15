/**
 * Notification delivery (SMS via Twilio, push via FCM). Mocked this phase — the
 * functions log instead of calling a gateway, so no provider creds/env are
 * required yet. Swapping in a real client is a drop-in change behind these
 * signatures; callers never touch the transport.
 */

export interface OtpDelivery {
  bookingId: string
  vehicleId: string
  otp: string
  expiresAt: Date
}

/**
 * "Deliver" a pickup OTP to the customer. Mock channel: the code is also returned
 * in the issue response for the demo. The plaintext lives only here and in that
 * one response — it is never persisted (only a hash is).
 */
export function sendOtp(delivery: OtpDelivery): void {
  console.info(
    `[notifications:mock] OTP for booking ${delivery.bookingId} (vehicle ${delivery.vehicleId}): ` +
      `${delivery.otp} — expires ${delivery.expiresAt.toISOString()}`,
  )
}
