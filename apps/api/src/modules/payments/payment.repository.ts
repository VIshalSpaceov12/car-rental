import type { PaymentStatus as DbPaymentStatus, Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'

export function createPayment(data: Prisma.PaymentUncheckedCreateInput) {
  return prisma.payment.create({ data })
}

/** The latest payment for a booking (a booking may accrue several over retries). */
export function findByBookingId(bookingId: string) {
  return prisma.payment.findFirst({ where: { bookingId }, orderBy: { createdAt: 'desc' } })
}

export function updatePaymentStatus(id: string, status: DbPaymentStatus) {
  return prisma.payment.update({ where: { id }, data: { status } })
}
