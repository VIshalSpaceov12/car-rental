import type { BookingStatus, BookingSummary } from '@car-rental/types'

/**
 * Terminal lifecycle states — a booking in any of these is "past" (no further
 * customer action drives it). Mirrors the empty-transition rows of
 * BOOKING_TRANSITIONS; kept as an explicit set so history is a pure predicate.
 */
const TERMINAL_STATUSES: readonly BookingStatus[] = ['completed', 'cancelled', 'rejected']

export const isTerminal = (status: BookingStatus): boolean => TERMINAL_STATUSES.includes(status)

/** Past rentals (terminal states) — newest first by start date. */
export function pastBookings(bookings: BookingSummary[]): BookingSummary[] {
  return bookings.filter((b) => isTerminal(b.status)).sort((a, b) => b.startAt.localeCompare(a.startAt))
}

/** Active rentals (everything not yet terminal) — newest first by start date. */
export function activeBookings(bookings: BookingSummary[]): BookingSummary[] {
  return bookings.filter((b) => !isTerminal(b.status)).sort((a, b) => b.startAt.localeCompare(a.startAt))
}

export interface ReceiptLine {
  /** i18n key under `receipt.lines.*`. */
  key: 'subtotal' | 'discount' | 'tax' | 'total'
  amount: number
}

/**
 * Itemized receipt derived entirely from data already on the booking summary
 * (no new endpoint). The discount line is omitted when nothing was discounted.
 */
export function receiptLines(booking: BookingSummary): ReceiptLine[] {
  const lines: ReceiptLine[] = [{ key: 'subtotal', amount: booking.subtotal }]
  if (booking.discountAmount > 0) lines.push({ key: 'discount', amount: -booking.discountAmount })
  lines.push({ key: 'tax', amount: booking.tax })
  lines.push({ key: 'total', amount: booking.total })
  return lines
}
