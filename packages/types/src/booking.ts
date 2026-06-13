import type { Branch } from './fleet'
import type { PaymentStatus } from './payment'

/**
 * Authoritative booking lifecycle. The backend owns transitions; both clients
 * import this union — never redefine status strings locally.
 */
export const BOOKING_STATUSES = [
  'reserved',
  'confirmed',
  'vehicle-prepared',
  'picked-up',
  'returned',
  'completed',
  'rejected',
  'cancelled',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

/**
 * Authoritative status machine — the only legal transitions. The backend
 * enforces it server-side (illegal transitions are rejected); clients import it
 * to decide which actions to offer. Terminal states map to `[]`.
 *
 * Phase 3 wires reserved→confirmed via provider *accept*; Phase 4 will move that
 * trigger to *payment* without changing this graph.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  reserved: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['vehicle-prepared', 'cancelled'],
  'vehicle-prepared': ['picked-up'],
  'picked-up': ['returned'],
  returned: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
}

export type RentalPlan = 'daily' | 'weekly' | 'monthly' | 'long-term'

export interface Booking {
  id: string
  customerId: string
  providerId: string
  vehicleId: string
  status: BookingStatus
  plan: RentalPlan
  pickupBranchId: string
  dropoffBranchId: string
  /** ISO 8601 */
  startAt: string
  /** ISO 8601 */
  endAt: string
  /** Itemized amounts (see Quote). `total = subtotal - discountAmount + tax`. */
  subtotal: number
  discountCode: string | null
  discountAmount: number
  tax: number
  total: number
  currency: string
  /** When the provider expects the vehicle ready for pickup (set on `prepare`). ISO 8601. */
  prepReadyAt: string | null
  /** ISO 8601 */
  createdAt: string
}

/** A booking enriched with display names, for provider/customer list screens. */
export interface BookingSummary extends Booking {
  vehicleName: string
  customerName: string
  pickupBranchName: string
  dropoffBranchName: string
  /** Latest payment status for the booking, or null if none recorded yet. */
  paymentStatus: PaymentStatus | null
}

/** Price a prospective rental without persisting anything. */
export interface QuoteRequest {
  vehicleId: string
  plan: RentalPlan
  /** ISO 8601 */
  startAt: string
  /** ISO 8601 */
  endAt: string
  discountCode?: string
}

/** Itemized price breakdown returned by `POST /bookings/quote`. */
export interface Quote {
  vehicleId: string
  plan: RentalPlan
  startAt: string
  endAt: string
  /** Billable rental days (rounded up, floored at the provider's minRentalDays). */
  days: number
  /** Days the customer actually selected (before the minRentalDays floor). */
  requestedDays: number
  /** True when `days` was raised to the provider's minRentalDays floor (so the client can disclose the charge). */
  minRentalDaysApplied: boolean
  pricePerDay: number
  /** Plan rate factor (e.g. weekly 0.9). */
  planMultiplier: number
  subtotal: number
  discountCode: string | null
  discountAmount: number
  taxRatePct: number
  tax: number
  total: number
  currency: string
}

/**
 * Minimal branch option for the booking customization screen (pickup/drop-off
 * pickers). A compiler-enforced subset of the fleet `Branch` (Phase 2 landed it),
 * so a rename of `Branch.name` surfaces here instead of drifting silently.
 */
export type BranchOption = Pick<Branch, 'id' | 'name'>

/** Create a booking (customer). Pricing is recomputed server-side, never trusted from the client. */
export interface CreateBookingRequest {
  vehicleId: string
  plan: RentalPlan
  pickupBranchId: string
  dropoffBranchId: string
  /** ISO 8601 */
  startAt: string
  /** ISO 8601 */
  endAt: string
  discountCode?: string
}

/** Provider marks a booking `vehicle-prepared`, optionally recording when it'll be ready. */
export interface PrepareBookingRequest {
  /** ISO 8601 — when the vehicle will be ready for pickup. */
  prepReadyAt?: string
}
