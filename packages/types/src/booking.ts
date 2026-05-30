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
  totalAmount: number
  currency: string
  /** ISO 8601 */
  createdAt: string
}
