import type {
  AuthUser,
  Booking,
  BookingStatus,
  BookingSummary,
  BranchOption,
  CreateBookingRequest,
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
    settings: {
      taxRatePct: settings.taxRatePct.toNumber(),
      planMultipliers: settings.planMultipliers as Record<string, number>,
      minRentalDays: settings.minRentalDays,
      currency: settings.currency,
    },
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
  if (new Date(input.endAt).getTime() <= new Date(input.startAt).getTime()) {
    throw new BookingError(400, 'endAt must be after startAt')
  }

  const { providerId, pricePerDay, settings } = await loadVehiclePricing(input.vehicleId)

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
    startAt: new Date(input.startAt),
    endAt: new Date(input.endAt),
    status: 'RESERVED',
    subtotal: q.subtotal,
    tax: q.tax,
    total: q.total,
    currency: q.currency,
    discountCode: q.discountCode,
  })
  return toWireBooking(created)
}

export async function listForUser(user: AuthUser): Promise<BookingSummary[]> {
  const rows =
    user.role === 'customer' ? await repo.listByCustomer(user.id) : await repo.listByProvider(user.providerId ?? '')
  return rows.map(toWireBookingSummary)
}

export type BookingAction = 'accept' | 'reject' | 'prepare' | 'cancel'

const ACTION_TARGET: Record<BookingAction, BookingStatus> = {
  accept: 'confirmed',
  reject: 'rejected',
  prepare: 'vehicle-prepared',
  cancel: 'cancelled',
}

/**
 * Drive a guarded status transition. `cancel` is the customer's own action;
 * accept/reject/prepare belong to the owning provider. The booking is looked up
 * within the caller's tenancy (404 otherwise), then the move is checked against
 * the authoritative graph (409 if illegal).
 */
export async function transition(user: AuthUser, bookingId: string, action: BookingAction): Promise<Booking> {
  const booking =
    action === 'cancel'
      ? await repo.findByIdForCustomer(bookingId, user.id)
      : await repo.findByIdForProvider(bookingId, user.providerId ?? '')
  if (!booking) throw new BookingError(404, 'booking not found')

  const from = toWireBooking(booking).status
  const to = ACTION_TARGET[action]
  if (!canTransition(from, to)) {
    throw new BookingError(409, `cannot ${action} a booking that is ${from}`)
  }

  const updated = await repo.updateStatus(bookingId, STATUS_TO_DB[to])
  return toWireBooking(updated)
}
