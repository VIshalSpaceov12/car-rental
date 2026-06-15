import { prisma } from '../../db/prisma'

export function findByBookingId(bookingId: string) {
  return prisma.contract.findUnique({ where: { bookingId } })
}

export function createContract(bookingId: string, content: string) {
  return prisma.contract.create({ data: { bookingId, content } })
}

export function signContract(bookingId: string, signerName: string) {
  return prisma.contract.update({
    where: { bookingId },
    data: { signedAt: new Date(), signerName, signedConsent: true },
  })
}
