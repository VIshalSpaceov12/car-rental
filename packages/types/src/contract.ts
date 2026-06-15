/**
 * Digital rental contract. Generated from the booking at pickup; signing it
 * (with a consumed OTP proving the lock-box was opened) drives the booking
 * `vehicle-prepared → picked-up`.
 */
export interface Contract {
  bookingId: string
  /** Human-readable rental terms, generated server-side from the booking. */
  content: string
  /** ISO 8601 once signed, otherwise null. */
  signedAt: string | null
  signerName: string | null
  signedConsent: boolean
}

/** Customer signs the contract: explicit consent + the name they sign under. */
export interface ContractSignRequest {
  signerName: string
  /** Must be `true` — an unchecked consent box is a 400, never a silent sign. */
  consent: boolean
}
