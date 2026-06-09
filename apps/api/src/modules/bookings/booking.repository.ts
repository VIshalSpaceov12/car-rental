import type { BookingStatus as DbBookingStatus, Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'

const summaryInclude = {
  vehicle: true,
  customer: true,
  pickupBranch: true,
  dropoffBranch: true,
} satisfies Prisma.BookingInclude

/** Vehicle + its provider's business settings — everything pricing needs. */
export function getVehicleWithSettings(vehicleId: string) {
  return prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { provider: { include: { businessSettings: true } } },
  })
}

export function findBranch(id: string) {
  return prisma.branch.findUnique({ where: { id } })
}

export function listBranchesByProvider(providerId: string) {
  return prisma.branch.findMany({ where: { providerId }, orderBy: { name: 'asc' } })
}

export function createBooking(data: Prisma.BookingUncheckedCreateInput) {
  return prisma.booking.create({ data })
}

export function listByCustomer(customerId: string) {
  return prisma.booking.findMany({ where: { customerId }, include: summaryInclude, orderBy: { createdAt: 'desc' } })
}

export function listByProvider(providerId: string) {
  return prisma.booking.findMany({ where: { providerId }, include: summaryInclude, orderBy: { createdAt: 'desc' } })
}

// Scoped lookups: a caller can only act on a booking within their own tenancy.
export function findByIdForProvider(id: string, providerId: string) {
  return prisma.booking.findFirst({ where: { id, providerId } })
}

export function findByIdForCustomer(id: string, customerId: string) {
  return prisma.booking.findFirst({ where: { id, customerId } })
}

export function updateStatus(id: string, status: DbBookingStatus) {
  return prisma.booking.update({ where: { id }, data: { status } })
}
