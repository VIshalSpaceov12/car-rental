import type { Prisma } from '@prisma/client'
import type { Vehicle } from '@car-rental/types'
import { prisma } from '../../db/prisma'

type VehicleRow = Prisma.VehicleGetPayload<{ include: { category: true } }>

export async function listVehicles(): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(toWireVehicle)
}

// Map the DB row to the @car-rental/types wire contract: Decimal -> number,
// enums -> lowercase wire strings, category relation -> its name.
function toWireVehicle(v: VehicleRow): Vehicle {
  return {
    id: v.id,
    providerId: v.providerId,
    name: v.name,
    category: v.category.name as Vehicle['category'],
    transmission: v.transmission.toLowerCase() as Vehicle['transmission'],
    fuelType: v.fuelType.toLowerCase() as Vehicle['fuelType'],
    seats: v.seats,
    pricePerDay: v.pricePerDay.toNumber(),
    currency: v.currency,
    images: v.images,
    available: v.available,
  }
}
