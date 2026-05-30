/**
 * OTP lock-box contracts. OTPs are security-sensitive and bound to
 * booking + vehicle + time window — never a bare code.
 */
export interface OtpIssueRequest {
  bookingId: string
}

export interface OtpIssueResponse {
  bookingId: string
  vehicleId: string
  otp: string
  /** ISO 8601 — OTP is only valid until this instant. */
  expiresAt: string
}

export interface OtpVerifyRequest {
  bookingId: string
  vehicleId: string
  otp: string
}

export interface OtpVerifyResponse {
  valid: boolean
}
