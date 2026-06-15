import type { Otp as DbOtp } from '@prisma/client'
import type { OtpStatus, OtpSummary } from '@car-rental/types'

/** Server-authoritative OTP status, derived from consume + expiry timestamps. */
export function otpStatus(otp: DbOtp, now = new Date()): OtpStatus {
  if (otp.consumedAt) return 'consumed'
  if (otp.expiresAt.getTime() <= now.getTime()) return 'expired'
  return 'issued'
}

/** Provider-facing summary — deliberately never carries the code or its hash. */
export function toOtpSummary(otp: DbOtp): OtpSummary {
  return {
    bookingId: otp.bookingId,
    vehicleId: otp.vehicleId,
    status: otpStatus(otp),
    expiresAt: otp.expiresAt.toISOString(),
    consumedAt: otp.consumedAt ? otp.consumedAt.toISOString() : null,
  }
}
