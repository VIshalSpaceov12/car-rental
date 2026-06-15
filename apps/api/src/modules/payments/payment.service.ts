import type { Payment, PayRequest } from '@car-rental/types'
import { canTransition } from '../bookings/booking.lifecycle'
import { STATUS_TO_DB, toWireBooking } from '../bookings/booking.mappers'
import * as bookingRepo from '../bookings/booking.repository'
import { METHOD_TO_DB, PAYMENT_STATUS_TO_DB, PAYMENT_STATUS_TO_WIRE, toWirePayment } from './payment.mappers'
import * as repo from './payment.repository'
import { emitBookingStatus } from '../realtime/realtime'

export class PaymentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

/**
 * Customer pays for a reserved booking. Payment is the `reserved → confirmed`
 * trigger (the provider no longer accepts manually).
 *
 * - `card-mock` succeeds → payment `paid`, booking `reserved → confirmed`.
 * - `card-mock` + `simulateFailure` → payment `failed`, booking stays `reserved`
 *   (PCI/C-8: a failed payment must not confirm a booking).
 * - `cash-on-delivery` → payment `pending` (settled at pickup), booking confirmed.
 *
 * Tenancy: the booking is looked up within the caller's ownership (404 otherwise).
 * Idempotency: a non-`failed` payment already on the booking blocks a re-pay (409).
 */
export async function pay(customerId: string, bookingId: string, req: PayRequest): Promise<Payment> {
  const booking = await bookingRepo.findByIdForCustomer(bookingId, customerId)
  if (!booking) throw new PaymentError(404, 'booking not found')

  const from = toWireBooking(booking).status
  if (from !== 'reserved') {
    throw new PaymentError(409, `cannot pay for a booking that is ${from}`)
  }

  // Idempotency: a still-live payment (paid/pending/refunded) blocks re-payment;
  // only a prior `failed` attempt may be retried.
  const existing = await repo.findByBookingId(bookingId)
  if (existing && PAYMENT_STATUS_TO_WIRE[existing.status] !== 'failed') {
    throw new PaymentError(409, 'booking already has a payment')
  }

  const failed = req.method === 'card-mock' && req.simulateFailure === true
  const status = failed ? 'failed' : req.method === 'card-mock' ? 'paid' : 'pending'

  const created = await repo.createPayment({
    bookingId,
    method: METHOD_TO_DB[req.method],
    status: PAYMENT_STATUS_TO_DB[status],
    amount: booking.total,
    gatewayRef: req.method === 'card-mock' && !failed ? `mock_${bookingId}` : null,
  })

  // A failed card payment leaves the booking reserved; everything else confirms it
  // via the authoritative reserved→confirmed edge.
  if (!failed && canTransition(from, 'confirmed')) {
    await bookingRepo.updateStatus(bookingId, STATUS_TO_DB.confirmed)
    emitBookingStatus({
      bookingId,
      status: 'confirmed',
      customerId: booking.customerId,
      providerId: booking.providerId,
    })
  }

  return toWirePayment(created)
}
