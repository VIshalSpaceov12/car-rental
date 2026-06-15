import type { Booking as DbBooking } from '@prisma/client'
import type { AuthUser, Contract, ContractSignRequest } from '@car-rental/types'
import { prisma } from '../../db/prisma'
import { canTransition } from '../bookings/booking.lifecycle'
import { STATUS_TO_DB, toWireBooking } from '../bookings/booking.mappers'
import * as bookingRepo from '../bookings/booking.repository'
import * as otpRepo from '../otp/otp.repository'
import { emitBookingStatus } from '../realtime/realtime'
import { buildContractContent } from './contract.content'
import { toWireContract } from './contract.mappers'
import * as repo from './contract.repository'

export class ContractError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ContractError'
  }
}

function requireProviderId(user: AuthUser): string {
  if (!user.providerId) throw new ContractError(400, 'provider context missing')
  return user.providerId
}

/** Resolve the booking within whichever tenancy the caller belongs to. */
function findBookingForUser(user: AuthUser, bookingId: string): Promise<DbBooking | null> {
  return user.role === 'customer'
    ? bookingRepo.findByIdForCustomer(bookingId, user.id)
    : bookingRepo.findByIdForProvider(bookingId, requireProviderId(user))
}

/** Lazily materialise the contract from the booking on first access. */
async function ensureContract(booking: DbBooking) {
  const existing = await repo.findByBookingId(booking.id)
  if (existing) return existing

  const vehicle = await prisma.vehicle.findUnique({ where: { id: booking.vehicleId } })
  const wire = toWireBooking(booking)
  const content = buildContractContent({
    bookingId: booking.id,
    vehicleName: vehicle?.name ?? booking.vehicleId,
    plan: wire.plan,
    startAt: wire.startAt,
    endAt: wire.endAt,
    total: wire.total,
    currency: wire.currency,
  })
  return repo.createContract(booking.id, content)
}

export async function getContract(user: AuthUser, bookingId: string): Promise<Contract> {
  const booking = await findBookingForUser(user, bookingId)
  if (!booking) throw new ContractError(404, 'booking not found')
  return toWireContract(await ensureContract(booking))
}

/**
 * Customer signs the contract at pickup. Requires explicit consent, a
 * `vehicle-prepared` booking, and a consumed OTP (the lock-box must have been
 * opened first). Signing drives `vehicle-prepared → picked-up`.
 */
export async function signContract(user: AuthUser, bookingId: string, req: ContractSignRequest): Promise<Contract> {
  if (!req.consent) throw new ContractError(400, 'consent is required to sign')

  const booking = await bookingRepo.findByIdForCustomer(bookingId, user.id)
  if (!booking) throw new ContractError(404, 'booking not found')

  const from = toWireBooking(booking).status
  if (from !== 'vehicle-prepared') {
    throw new ContractError(409, `cannot sign a contract for a booking that is ${from}`)
  }

  const otp = await otpRepo.findCurrent(bookingId)
  if (!otp?.consumedAt) {
    throw new ContractError(409, 'unlock the vehicle with the OTP before signing')
  }

  const existing = await repo.findByBookingId(bookingId)
  if (existing?.signedAt) throw new ContractError(409, 'contract already signed')

  await ensureContract(booking)
  const signed = await repo.signContract(bookingId, req.signerName)

  if (canTransition(from, 'picked-up')) {
    await bookingRepo.updateStatus(bookingId, STATUS_TO_DB['picked-up'])
    emitBookingStatus({
      bookingId,
      status: 'picked-up',
      customerId: booking.customerId,
      providerId: booking.providerId,
    })
  }
  return toWireContract(signed)
}
