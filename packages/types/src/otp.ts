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

/**
 * Lifecycle of an issued OTP, for provider tracking (dashboard). Derived
 * server-side from `consumedAt` + `expiresAt` — never recomputed on the client.
 */
export type OtpStatus = 'issued' | 'consumed' | 'expired'

/**
 * Provider's view of a booking's current OTP. Deliberately omits the code/hash —
 * the plaintext is returned only once at issuance and never re-exposed.
 */
export interface OtpSummary {
  bookingId: string
  vehicleId: string
  status: OtpStatus
  /** ISO 8601 */
  expiresAt: string
  /** ISO 8601, or null while still live. */
  consumedAt: string | null
}
