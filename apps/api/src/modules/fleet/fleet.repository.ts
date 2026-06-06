import { Prisma } from '@prisma/client'
import type {
  Branch,
  Category,
  CreateBranchRequest,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleFilters,
} from '@car-rental/types'
import { prisma } from '../../db/prisma'

type VehicleRow = Prisma.VehicleGetPayload<{ include: { category: true } }>

// ---------- Vehicles ----------

export async function listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  const where: Prisma.VehicleWhereInput = {}
  if (filters.providerId) where.providerId = filters.providerId
  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.transmission) where.transmission = filters.transmission.toUpperCase() as Prisma.EnumTransmissionFilter['equals']
  if (filters.fuelType) where.fuelType = filters.fuelType.toUpperCase() as Prisma.EnumFuelTypeFilter['equals']
  if (typeof filters.available === 'boolean') where.available = filters.available
  if (typeof filters.maxPrice === 'number') where.pricePerDay = { lte: filters.maxPrice }

  const rows = await prisma.vehicle.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(toWireVehicle)
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const row = await prisma.vehicle.findUnique({ where: { id }, include: { category: true } })
  return row ? toWireVehicle(row) : null
}

export async function createVehicle(providerId: string, input: CreateVehicleRequest): Promise<Vehicle> {
  const row = await prisma.vehicle.create({
    data: {
      providerId,
      categoryId: input.categoryId,
      name: input.name,
      transmission: input.transmission.toUpperCase() as VehicleRow['transmission'],
      fuelType: input.fuelType.toUpperCase() as VehicleRow['fuelType'],
      seats: input.seats,
      pricePerDay: input.pricePerDay,
      currency: input.currency,
      images: input.images ?? [],
      available: input.available ?? true,
    },
    include: { category: true },
  })
  return toWireVehicle(row)
}

// Provider-scoped: updateMany/deleteMany on { id, providerId } returns 0 when the
// vehicle isn't the caller's, so cross-tenant access surfaces as 404 with no extra query.
export async function updateVehicle(
  id: string,
  providerId: string,
  input: UpdateVehicleRequest,
): Promise<Vehicle | null> {
  const { count } = await prisma.vehicle.updateMany({
    where: { id, providerId },
    data: {
      categoryId: input.categoryId,
      name: input.name,
      transmission: input.transmission?.toUpperCase() as VehicleRow['transmission'] | undefined,
      fuelType: input.fuelType?.toUpperCase() as VehicleRow['fuelType'] | undefined,
      seats: input.seats,
      pricePerDay: input.pricePerDay,
      currency: input.currency,
      images: input.images,
      available: input.available,
    },
  })
  return count ? getVehicle(id) : null
}

export async function deleteVehicle(id: string, providerId: string): Promise<boolean> {
  const { count } = await prisma.vehicle.deleteMany({ where: { id, providerId } })
  return count > 0
}

// ---------- Categories ----------

export async function listCategories(providerId: string): Promise<Category[]> {
  const rows = await prisma.vehicleCategory.findMany({ where: { providerId }, orderBy: { name: 'asc' } })
  return rows.map((c) => ({ id: c.id, name: c.name }))
}

export async function createCategory(providerId: string, name: string): Promise<Category> {
  const c = await prisma.vehicleCategory.create({ data: { providerId, name } })
  return { id: c.id, name: c.name }
}

export async function deleteCategory(id: string, providerId: string): Promise<boolean> {
  const { count } = await prisma.vehicleCategory.deleteMany({ where: { id, providerId } })
  return count > 0
}

// ---------- Branches ----------

export async function listBranches(providerId: string): Promise<Branch[]> {
  const rows = await prisma.branch.findMany({ where: { providerId }, orderBy: { name: 'asc' } })
  return rows.map(toWireBranch)
}

export async function createBranch(providerId: string, input: CreateBranchRequest): Promise<Branch> {
  const b = await prisma.branch.create({ data: { providerId, ...input } })
  return toWireBranch(b)
}

export async function deleteBranch(id: string, providerId: string): Promise<boolean> {
  const { count } = await prisma.branch.deleteMany({ where: { id, providerId } })
  return count > 0
}

// ---------- Mappers ----------

function toWireVehicle(v: VehicleRow): Vehicle {
  return {
    id: v.id,
    providerId: v.providerId,
    name: v.name,
    categoryId: v.categoryId,
    category: v.category.name,
    transmission: v.transmission.toLowerCase() as Vehicle['transmission'],
    fuelType: v.fuelType.toLowerCase() as Vehicle['fuelType'],
    seats: v.seats,
    pricePerDay: v.pricePerDay.toNumber(),
    currency: v.currency,
    images: v.images,
    available: v.available,
  }
}

function toWireBranch(b: {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  hours: string
}): Branch {
  return { id: b.id, name: b.name, address: b.address, lat: b.lat, lng: b.lng, hours: b.hours }
}
