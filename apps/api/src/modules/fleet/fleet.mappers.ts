import type { FuelType as DbFuelType, Transmission as DbTransmission } from '@prisma/client'
import type { FuelType, Transmission } from '@car-rental/types'

// DB enums are UPPER; wire strings are lowercase. Map explicitly at this boundary
// (mirrors booking.mappers.ts PLAN_TO_DB) instead of toUpperCase()/toLowerCase()
// casts, so a new enum member is a compile error rather than a silent miscast.
export const TRANSMISSION_TO_DB: Record<Transmission, DbTransmission> = {
  automatic: 'AUTOMATIC',
  manual: 'MANUAL',
}

export const TRANSMISSION_TO_WIRE: Record<DbTransmission, Transmission> = {
  AUTOMATIC: 'automatic',
  MANUAL: 'manual',
}

export const FUEL_TYPE_TO_DB: Record<FuelType, DbFuelType> = {
  petrol: 'PETROL',
  diesel: 'DIESEL',
  electric: 'ELECTRIC',
  hybrid: 'HYBRID',
}

export const FUEL_TYPE_TO_WIRE: Record<DbFuelType, FuelType> = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
}
