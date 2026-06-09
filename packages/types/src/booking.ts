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
  /** ISO 8601 */
  createdAt: string
}

/** A booking enriched with display names, for provider/customer list screens. */
export interface BookingSummary extends Booking {
  vehicleName: string
  customerName: string
  pickupBranchName: string
  dropoffBranchName: string
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
 * pickers). Booking-scoped on purpose — the full Branch entity + management API
 * is the fleet domain (Phase 2); clients migrate to it when it lands.
 */
export interface BranchOption {
  id: string
  name: string
}

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
