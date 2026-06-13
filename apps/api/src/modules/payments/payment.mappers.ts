import type {
  Payment as DbPayment,
  PaymentMethod as DbPaymentMethod,
  PaymentStatus as DbPaymentStatus,
} from '@prisma/client'
import type { Payment, PaymentMethod, PaymentStatus } from '@car-rental/types'

// DB enums are UPPER_SNAKE; wire strings are kebab/lowercase. Map explicitly at
// this boundary (mirrors booking.mappers.ts / fleet.mappers.ts) so a new enum
// member is a compile error rather than a silent miscast.
export const METHOD_TO_DB: Record<PaymentMethod, DbPaymentMethod> = {
  'card-mock': 'CARD_MOCK',
  'cash-on-delivery': 'CASH_ON_DELIVERY',
}

export const METHOD_TO_WIRE: Record<DbPaymentMethod, PaymentMethod> = {
  CARD_MOCK: 'card-mock',
  CASH_ON_DELIVERY: 'cash-on-delivery',
}

export const PAYMENT_STATUS_TO_DB: Record<PaymentStatus, DbPaymentStatus> = {
  pending: 'PENDING',
  paid: 'PAID',
  failed: 'FAILED',
  refunded: 'REFUNDED',
}

export const PAYMENT_STATUS_TO_WIRE: Record<DbPaymentStatus, PaymentStatus> = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}

/** Map a Payment row to the wire contract: Decimal→number, Date→ISO, enums→wire. */
export function toWirePayment(p: DbPayment): Payment {
  return {
    id: p.id,
    bookingId: p.bookingId,
    method: METHOD_TO_WIRE[p.method],
    status: PAYMENT_STATUS_TO_WIRE[p.status],
    amount: p.amount.toNumber(),
    gatewayRef: p.gatewayRef,
    createdAt: p.createdAt.toISOString(),
  }
}
