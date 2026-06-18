import type { Vehicle } from '@car-rental/types'

/**
 * The Vehicle contract has no engine/horsepower fields, but the design shows
 * them. We derive presentational placeholders deterministically from the id so a
 * given car always reads the same value, until those fields exist on the API.
 */
const hash = (id: string, salt: number): number => {
  let h = salt
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

/** Presentational horsepower placeholder in a plausible 320–620 hp range. */
export const horsepowerFor = (id: string): number => 320 + (hash(id, 11) % 30) * 10

/** Presentational engine label placeholder, stable per vehicle. */
export function engineFor(vehicle: Vehicle): string {
  if (vehicle.fuelType === 'electric') return 'Dual Motor'
  const options = ['V8 Twin-Turbo', 'V6 Turbo', 'Inline-6', 'V12']
  return options[hash(vehicle.id, 5) % options.length]!
}

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s)

/** Display label for a transmission value (capitalized). */
export const transmissionLabel = (vehicle: Vehicle): string => cap(vehicle.transmission)

/** Display label for a fuel type (capitalized). */
export const fuelLabel = (vehicle: Vehicle): string => cap(vehicle.fuelType)
