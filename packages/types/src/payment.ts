/**
 * Payment contracts. Wire strings are kebab/lowercase; the API maps them to the
 * Prisma UPPER_SNAKE enums at the repo boundary. PCI: the pay request carries NO
 * card data — the mock gateway only needs the method (+ a test-only failure flag).
 */
export const PAYMENT_METHODS = ['card-mock', 'cash-on-delivery'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export interface Payment {
  id: string
  bookingId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  /** Mock gateway reference (e.g. `mock_…`); never a real PAN. */
  gatewayRef: string | null
  /** ISO 8601 */
  createdAt: string
}

/**
 * Pay a reserved booking. Carries no card data (PCI): `card-mock` auto-succeeds,
 * `cash-on-delivery` confirms immediately (settled at pickup). `simulateFailure`
 * is a test/demo hook to exercise the failed-payment path.
 */
export interface PayRequest {
  method: PaymentMethod
  simulateFailure?: boolean
}
