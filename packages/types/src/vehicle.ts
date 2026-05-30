export type VehicleCategory = 'economy' | 'suv' | 'luxury' | 'van' | 'other'
export type Transmission = 'automatic' | 'manual'
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

export interface Vehicle {
  id: string
  providerId: string
  name: string
  category: VehicleCategory
  transmission: Transmission
  fuelType: FuelType
  seats: number
  pricePerDay: number
  currency: string
  images: string[]
  available: boolean
}
