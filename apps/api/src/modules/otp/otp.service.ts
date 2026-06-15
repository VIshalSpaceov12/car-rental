import bcrypt from 'bcrypt'
import { randomInt } from 'node:crypto'
import type { AuthUser, OtpIssueResponse, OtpSummary, OtpVerifyRequest, OtpVerifyResponse } from '@car-rental/types'
import { toWireBooking } from '../bookings/booking.mappers'
import * as bookingRepo from '../bookings/booking.repository'
import { sendOtp } from '../notifications/notifications.service'
import { toOtpSummary } from './otp.mappers'
import * as repo from './otp.repository'

export class OtpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'OtpError'
  }
}

const OTP_LENGTH = 6
// After this many wrong guesses the code is dead — re-issue is the only recovery.
const MAX_FAILED_ATTEMPTS = 5
const BCRYPT_ROUNDS = 10

/** Fail-closed tenant resolution: a provider action needs a provider context. */
function requireProviderId(user: AuthUser): string {
  if (!user.providerId) throw new OtpError(400, 'provider context missing')
  return user.providerId
}

function generateCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
}

/**
 * Provider issues a pickup OTP for one of its bookings. The code is bound to the
 * booking + its vehicle, expires at the end of the rental window, and is stored
 * only as a bcrypt hash. Re-issue replaces any prior code. The plaintext is
 * returned once (mock delivery) and never persisted.
 */
export async function issue(user: AuthUser, bookingId: string): Promise<OtpIssueResponse> {
  const booking = await bookingRepo.findByIdForProvider(bookingId, requireProviderId(user))
  if (!booking) throw new OtpError(404, 'booking not found')

  const status = toWireBooking(booking).status
  if (status !== 'vehicle-prepared') {
    throw new OtpError(409, `cannot issue an OTP for a booking that is ${status}`)
  }

  const code = generateCode()
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS)
  const expiresAt = booking.endAt

  await repo.deleteByBookingId(bookingId)
  await repo.createOtp({ bookingId, vehicleId: booking.vehicleId, codeHash, expiresAt })

  sendOtp({ bookingId, vehicleId: booking.vehicleId, otp: code, expiresAt })

  return { bookingId, vehicleId: booking.vehicleId, otp: code, expiresAt: expiresAt.toISOString() }
}

/**
 * Customer verifies a code to "unlock the box". Verification is server-
 * authoritative: it enforces the booking + vehicle binding, expiry, one-time use,
 * and an attempt cap. A successful match consumes the OTP. Any failure leaves the
 * booking untouched and returns `{ valid: false }` (no detail, to avoid oracles).
 */
export async function verify(user: AuthUser, req: OtpVerifyRequest): Promise<OtpVerifyResponse> {
  const booking = await bookingRepo.findByIdForCustomer(req.bookingId, user.id)
  if (!booking) throw new OtpError(404, 'booking not found')

  const otp = await repo.findCurrent(req.bookingId)
  if (!otp) return { valid: false }
  if (otp.consumedAt) return { valid: false }
  if (otp.expiresAt.getTime() <= Date.now()) return { valid: false }
  if (otp.failedAttempts >= MAX_FAILED_ATTEMPTS) return { valid: false }

  const matches = otp.vehicleId === req.vehicleId && (await bcrypt.compare(req.otp, otp.codeHash))
  if (!matches) {
    await repo.incrementFailedAttempts(otp.id)
    return { valid: false }
  }

  await repo.markConsumed(otp.id)
  return { valid: true }
}

/** Provider's view of a booking's current OTP (status only, never the code). */
export async function getSummary(user: AuthUser, bookingId: string): Promise<OtpSummary> {
  const booking = await bookingRepo.findByIdForProvider(bookingId, requireProviderId(user))
  if (!booking) throw new OtpError(404, 'booking not found')

  const otp = await repo.findCurrent(bookingId)
  if (!otp) throw new OtpError(404, 'no otp for this booking')
  return toOtpSummary(otp)
}
