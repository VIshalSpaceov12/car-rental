import type {
  Booking as DbBooking,
  BookingStatus as DbBookingStatus,
  Prisma,
  RentalPlan as DbRentalPlan,
} from '@prisma/client'
import type { Booking, BookingStatus, BookingSummary, RentalPlan } from '@car-rental/types'

// DB enums are UPPER_SNAKE; wire strings are kebab/lowercase. Map at this boundary.
export const PLAN_TO_DB: Record<RentalPlan, DbRentalPlan> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  'long-term': 'LONG_TERM',
}

const PLAN_TO_WIRE: Record<DbRentalPlan, RentalPlan> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  LONG_TERM: 'long-term',
}

export const STATUS_TO_DB: Record<BookingStatus, DbBookingStatus> = {
  reserved: 'RESERVED',
  confirmed: 'CONFIRMED',
  'vehicle-prepared': 'VEHICLE_PREPARED',
  'picked-up': 'PICKED_UP',
  returned: 'RETURNED',
  completed: 'COMPLETED',
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
}

const STATUS_TO_WIRE: Record<DbBookingStatus, BookingStatus> = {
  RESERVED: 'reserved',
  CONFIRMED: 'confirmed',
  VEHICLE_PREPARED: 'vehicle-prepared',
  PICKED_UP: 'picked-up',
  RETURNED: 'returned',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Map a Booking row to the wire contract: Decimal→number, Date→ISO, enums→wire. */
export function toWireBooking(b: DbBooking): Booking {
  const subtotal = b.subtotal.toNumber()
  const tax = b.tax.toNumber()
  const total = b.total.toNumber()
  return {
    id: b.id,
    customerId: b.customerId,
    providerId: b.providerId,
    vehicleId: b.vehicleId,
    status: STATUS_TO_WIRE[b.status],
    plan: PLAN_TO_WIRE[b.plan],
    pickupBranchId: b.pickupBranchId,
    dropoffBranchId: b.dropoffBranchId,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    subtotal,
    discountCode: b.discountCode,
    // discountAmount isn't stored; derive it from total = subtotal - discount + tax.
    discountAmount: round2(subtotal + tax - total),
    tax,
    total,
    currency: b.currency,
    createdAt: b.createdAt.toISOString(),
  }
}

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { vehicle: true; customer: true; pickupBranch: true; dropoffBranch: true }
}>

/** A list-screen row: a wire Booking plus the display names of its relations. */
export function toWireBookingSummary(b: BookingWithRelations): BookingSummary {
  return {
    ...toWireBooking(b),
    vehicleName: b.vehicle.name,
    customerName: b.customer.name,
    pickupBranchName: b.pickupBranch.name,
    dropoffBranchName: b.dropoffBranch.name,
  }
}
