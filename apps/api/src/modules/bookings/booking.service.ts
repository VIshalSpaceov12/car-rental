import type {
  AuthUser,
  Booking,
  BookingStatus,
  BookingSummary,
  BranchOption,
  CompleteBookingRequest,
  CreateBookingRequest,
  CreateRatingRequest,
  PrepareBookingRequest,
  Quote,
  QuoteRequest,
  Rating,
  ReturnInspection,
} from '@car-rental/types'
import { canTransition } from './booking.lifecycle'
import { computeQuote } from './booking.pricing'
import {
  CONDITION_TO_DB,
  PLAN_TO_DB,
  STATUS_TO_DB,
  toWireBooking,
  toWireBookingSummary,
  toWireRating,
  toWireReturnInspection,
} from './booking.mappers'
import * as repo from './booking.repository'
import { PAYMENT_STATUS_TO_WIRE } from '../payments/payment.mappers'
import * as paymentRepo from '../payments/payment.repository'
import { emitBookingStatus } from '../realtime/realtime'

export class BookingError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

async function loadVehiclePricing(vehicleId: string) {
  const vehicle = await repo.getVehicleWithSettings(vehicleId)
  if (!vehicle) throw new BookingError(404, 'vehicle not found')
  const settings = vehicle.provider.businessSettings
  if (!settings) throw new BookingError(500, 'provider has no business settings')
  return {
    providerId: vehicle.providerId,
    pricePerDay: vehicle.pricePerDay.toNumber(),
    available: vehicle.available,
    status: vehicle.status,
    settings: {
      taxRatePct: settings.taxRatePct.toNumber(),
      planMultipliers: settings.planMultipliers as Record<string, number>,
      minRentalDays: settings.minRentalDays,
      currency: settings.currency,
    },
  }
}

/** Fail-closed tenant resolution: non-customers must carry a provider context. */
function requireProviderId(user: AuthUser): string {
  if (!user.providerId) throw new BookingError(400, 'provider context missing')
  return user.providerId
}

/** Best-effort realtime push so both parties see a status change live. */
function emitStatus(b: Booking): void {
  emitBookingStatus({ bookingId: b.id, status: b.status, customerId: b.customerId, providerId: b.providerId })
}

/** A cancelled booking refunds its latest `paid` payment (COD/pending settles to nothing). */
async function refundPaidPayment(bookingId: string): Promise<void> {
  const payment = await paymentRepo.findByBookingId(bookingId)
  if (payment && PAYMENT_STATUS_TO_WIRE[payment.status] === 'paid') {
    await paymentRepo.updatePaymentStatus(payment.id, 'REFUNDED')
  }
}

export async function quote(input: QuoteRequest): Promise<Quote> {
  const { pricePerDay, settings } = await loadVehiclePricing(input.vehicleId)
  return computeQuote(input, { pricePerDay }, settings)
}

/** Branches the customer can pick up/drop off at — those of the vehicle's provider. */
export async function listVehicleBranchOptions(vehicleId: string): Promise<BranchOption[]> {
  const vehicle = await repo.getVehicleWithSettings(vehicleId)
  if (!vehicle) throw new BookingError(404, 'vehicle not found')
  const branches = await repo.listBranchesByProvider(vehicle.providerId)
  return branches.map((b) => ({ id: b.id, name: b.name }))
}

export async function createBooking(customerId: string, input: CreateBookingRequest): Promise<Booking> {
  const startAt = new Date(input.startAt)
  const endAt = new Date(input.endAt)
  if (endAt.getTime() <= startAt.getTime()) {
    throw new BookingError(400, 'endAt must be after startAt')
  }
  if (startAt.getTime() < Date.now()) {
    throw new BookingError(400, 'startAt must not be in the past')
  }

  const { providerId, pricePerDay, available, status, settings } = await loadVehiclePricing(input.vehicleId)

  // The vehicle must be bookable: listed as available and operationally active.
  if (!available || status !== 'ACTIVE') {
    throw new BookingError(409, 'vehicle is not available for booking')
  }

  // No double-booking: reject if any non-rejected/cancelled booking overlaps the range.
  const overlaps = await repo.findOverlappingBookings(input.vehicleId, startAt, endAt)
  if (overlaps.length > 0) {
    throw new BookingError(409, 'vehicle is already booked for the selected dates')
  }

  // Pickup/drop-off must be branches of the vehicle's provider.
  for (const branchId of [input.pickupBranchId, input.dropoffBranchId]) {
    const branch = await repo.findBranch(branchId)
    if (!branch || branch.providerId !== providerId) {
      throw new BookingError(400, 'branch does not belong to the vehicle provider')
    }
  }

  const q = computeQuote(input, { pricePerDay }, settings)
  const created = await repo.createBooking({
    customerId,
    providerId,
    vehicleId: input.vehicleId,
    plan: PLAN_TO_DB[input.plan],
    pickupBranchId: input.pickupBranchId,
    dropoffBranchId: input.dropoffBranchId,
    startAt,
    endAt,
    status: 'RESERVED',
    subtotal: q.subtotal,
    tax: q.tax,
    total: q.total,
    currency: q.currency,
    discountCode: q.discountCode,
    discountAmount: q.discountAmount,
  })
  return toWireBooking(created)
}

export async function listForUser(user: AuthUser): Promise<BookingSummary[]> {
  const rows =
    user.role === 'customer' ? await repo.listByCustomer(user.id) : await repo.listByProvider(requireProviderId(user))
  return rows.map(toWireBookingSummary)
}

// Customer cancels their own; the rest are provider actions on a tenant-owned
// booking. Confirmation is no longer a manual provider action — payment drives
// reserved→confirmed (see payments module).
export type BookingAction = 'reject' | 'cancel' | 'provider-cancel'

const ACTION_TARGET: Record<BookingAction, BookingStatus> = {
  reject: 'rejected',
  cancel: 'cancelled',
  'provider-cancel': 'cancelled',
}

/**
 * Drive a guarded status transition. `cancel` is the customer's own action;
 * reject/provider-cancel belong to the owning provider. The booking is looked up
 * within the caller's tenancy (404 otherwise), then the move is checked against
 * the authoritative graph (409 if illegal). Cancelling a booking that already has
 * a `paid` payment refunds it.
 */
export async function transition(user: AuthUser, bookingId: string, action: BookingAction): Promise<Booking> {
  const booking =
    action === 'cancel'
      ? await repo.findByIdForCustomer(bookingId, user.id)
      : await repo.findByIdForProvider(bookingId, requireProviderId(user))
  if (!booking) throw new BookingError(404, 'booking not found')

  const from = toWireBooking(booking).status
  const to = ACTION_TARGET[action]
  if (!canTransition(from, to)) {
    throw new BookingError(409, `cannot ${action} a booking that is ${from}`)
  }

  const updated = await repo.updateStatus(bookingId, STATUS_TO_DB[to])
  if (to === 'cancelled') await refundPaidPayment(bookingId)
  const wire = toWireBooking(updated)
  emitStatus(wire)
  return wire
}

/**
 * Provider marks a tenant-owned booking `vehicle-prepared`, optionally recording
 * when the vehicle will be ready (`prepReadyAt`). Same tenancy + transition guards
 * as the generic actions, but persists the prep timestamp alongside the status.
 */
export async function prepareBooking(
  user: AuthUser,
  bookingId: string,
  input: PrepareBookingRequest,
): Promise<Booking> {
  const booking = await repo.findByIdForProvider(bookingId, requireProviderId(user))
  if (!booking) throw new BookingError(404, 'booking not found')

  const from = toWireBooking(booking).status
  if (!canTransition(from, 'vehicle-prepared')) {
    throw new BookingError(409, `cannot prepare a booking that is ${from}`)
  }

  const prepReadyAt = input.prepReadyAt ? new Date(input.prepReadyAt) : undefined
  const updated = await repo.updateStatus(bookingId, STATUS_TO_DB['vehicle-prepared'], { prepReadyAt })
  const wire = toWireBooking(updated)
  emitStatus(wire)
  return wire
}

/**
 * Customer returns the vehicle (drops it + locks the box): `picked-up → returned`.
 * The provider still has to inspect and complete it.
 */
export async function returnBooking(user: AuthUser, bookingId: string): Promise<Booking> {
  const booking = await repo.findByIdForCustomer(bookingId, user.id)
  if (!booking) throw new BookingError(404, 'booking not found')

  const from = toWireBooking(booking).status
  if (!canTransition(from, 'returned')) {
    throw new BookingError(409, `cannot return a booking that is ${from}`)
  }

  const updated = await repo.updateStatus(bookingId, STATUS_TO_DB.returned)
  const wire = toWireBooking(updated)
  emitStatus(wire)
  return wire
}

/**
 * Provider inspects a returned vehicle and completes the booking:
 * `returned → completed`, recording the vehicle's condition.
 */
export async function completeBooking(
  user: AuthUser,
  bookingId: string,
  input: CompleteBookingRequest,
): Promise<Booking> {
  const booking = await repo.findByIdForProvider(bookingId, requireProviderId(user))
  if (!booking) throw new BookingError(404, 'booking not found')

  const from = toWireBooking(booking).status
  if (!canTransition(from, 'completed')) {
    throw new BookingError(409, `cannot complete a booking that is ${from}`)
  }

  await repo.createReturnInspection({
    bookingId,
    inspectorId: user.id,
    condition: CONDITION_TO_DB[input.condition],
    notes: input.notes ?? null,
  })
  const updated = await repo.updateStatus(bookingId, STATUS_TO_DB.completed)
  const wire = toWireBooking(updated)
  emitStatus(wire)
  return wire
}

/** Provider reads the recorded return inspection for one of its bookings. */
export async function getReturnInspection(user: AuthUser, bookingId: string): Promise<ReturnInspection> {
  const booking = await repo.findByIdForProvider(bookingId, requireProviderId(user))
  if (!booking) throw new BookingError(404, 'booking not found')

  const inspection = await repo.findReturnInspection(bookingId)
  if (!inspection) throw new BookingError(404, 'no inspection for this booking')
  return toWireReturnInspection(inspection)
}

/** Customer rates a completed rental (vehicle + service). One rating per booking. */
export async function rateBooking(user: AuthUser, bookingId: string, input: CreateRatingRequest): Promise<Rating> {
  const booking = await repo.findByIdForCustomer(bookingId, user.id)
  if (!booking) throw new BookingError(404, 'booking not found')

  const from = toWireBooking(booking).status
  if (from !== 'completed') {
    throw new BookingError(409, `cannot rate a booking that is ${from}`)
  }
  if (await repo.findRating(bookingId)) {
    throw new BookingError(409, 'booking already rated')
  }

  const created = await repo.createRating({
    bookingId,
    customerId: user.id,
    vehicleRating: input.vehicleRating,
    serviceRating: input.serviceRating,
    comment: input.comment ?? null,
  })
  return toWireRating(created)
}

/** Read a booking's rating (the owning customer or provider). */
export async function getRating(user: AuthUser, bookingId: string): Promise<Rating> {
  const booking =
    user.role === 'customer'
      ? await repo.findByIdForCustomer(bookingId, user.id)
      : await repo.findByIdForProvider(bookingId, requireProviderId(user))
  if (!booking) throw new BookingError(404, 'booking not found')

  const rating = await repo.findRating(bookingId)
  if (!rating) throw new BookingError(404, 'no rating for this booking')
  return toWireRating(rating)
}
