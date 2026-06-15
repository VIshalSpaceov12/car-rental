import type { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'

export function createOtp(data: Prisma.OtpUncheckedCreateInput) {
  return prisma.otp.create({ data })
}

/** Re-issue replaces: a booking carries at most one live OTP. */
export function deleteByBookingId(bookingId: string) {
  return prisma.otp.deleteMany({ where: { bookingId } })
}

/** The booking's current OTP, or null if none has been issued. */
export function findCurrent(bookingId: string) {
  return prisma.otp.findFirst({ where: { bookingId }, orderBy: { createdAt: 'desc' } })
}

export function markConsumed(id: string) {
  return prisma.otp.update({ where: { id }, data: { consumedAt: new Date() } })
}

export function incrementFailedAttempts(id: string) {
  return prisma.otp.update({ where: { id }, data: { failedAttempts: { increment: 1 } } })
}
