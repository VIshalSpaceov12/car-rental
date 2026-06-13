import type {
  AuthUser,
  Booking,
  BookingStatus,
  BookingSummary,
  BranchOption,
  CreateBookingRequest,
  PrepareBookingRequest,
  Quote,
  QuoteRequest,
} from '@car-rental/types'
import { canTransition } from './booking.lifecycle'
import { computeQuote } from './booking.pricing'
import { PLAN_TO_DB, STATUS_TO_DB, toWireBooking, toWireBookingSummary } from './booking.mappers'
import * as repo from './booking.repository'

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

// Customer cancels their own; the rest are provider actions on a tenant-owned booking.
export type BookingAction = 'accept' | 'reject' | 'cancel' | 'provider-cancel'

const ACTION_TARGET: Record<BookingAction, BookingStatus> = {
  accept: 'confirmed',
  reject: 'rejected',
  cancel: 'cancelled',
  'provider-cancel': 'cancelled',
}

/**
 * Drive a guarded status transition. `cancel` is the customer's own action;
 * accept/reject/provider-cancel belong to the owning provider. The booking is
 * looked up within the caller's tenancy (404 otherwise), then the move is checked
 * against the authoritative graph (409 if illegal).
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
  return toWireBooking(updated)
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
  return toWireBooking(updated)
}
