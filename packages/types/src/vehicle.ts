export type VehicleCategory = 'economy' | 'suv' | 'luxury' | 'van' | 'other'
export type Transmission = 'automatic' | 'manual'
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

export interface Vehicle {
  id: string
  providerId: string
  name: string
  categoryId: string
  /** Display name of the category (provider-defined, not constrained to the union). */
  category: string
  transmission: Transmission
  fuelType: FuelType
  seats: number
  pricePerDay: number
  currency: string
  images: string[]
  available: boolean
}
