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
import { FUEL_TYPE_TO_DB, FUEL_TYPE_TO_WIRE, TRANSMISSION_TO_DB, TRANSMISSION_TO_WIRE } from './fleet.mappers'

type VehicleRow = Prisma.VehicleGetPayload<{ include: { category: true } }>

// ---------- Vehicles ----------

export async function listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  const where: Prisma.VehicleWhereInput = {}
  if (filters.providerId) where.providerId = filters.providerId
  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.transmission) where.transmission = TRANSMISSION_TO_DB[filters.transmission]
  if (filters.fuelType) where.fuelType = FUEL_TYPE_TO_DB[filters.fuelType]
  if (typeof filters.available === 'boolean') where.available = filters.available
  if (typeof filters.minPrice === 'number' || typeof filters.maxPrice === 'number') {
    where.pricePerDay = {
      ...(typeof filters.minPrice === 'number' ? { gte: filters.minPrice } : {}),
      ...(typeof filters.maxPrice === 'number' ? { lte: filters.maxPrice } : {}),
    }
  }

  const rows = await prisma.vehicle.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(toWireVehicle)
}

/** Tenant-scoped management list: every vehicle owned by the provider (any availability). */
export async function listProviderVehicles(providerId: string): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { providerId },
    include: { category: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(toWireVehicle)
}

/** Public browse type-filter: the categories of the seeded/primary provider's catalog. */
export async function listAllCategories(): Promise<Category[]> {
  const rows = await prisma.vehicleCategory.findMany({ orderBy: { name: 'asc' } })
  return rows.map((c) => ({ id: c.id, name: c.name }))
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
      transmission: TRANSMISSION_TO_DB[input.transmission],
      fuelType: FUEL_TYPE_TO_DB[input.fuelType],
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
      transmission: input.transmission ? TRANSMISSION_TO_DB[input.transmission] : undefined,
      fuelType: input.fuelType ? FUEL_TYPE_TO_DB[input.fuelType] : undefined,
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
    transmission: TRANSMISSION_TO_WIRE[v.transmission],
    fuelType: FUEL_TYPE_TO_WIRE[v.fuelType],
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
