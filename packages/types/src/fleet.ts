import type { FuelType, Transmission } from './vehicle'

export interface Category {
  id: string
  name: string
}

export interface Branch {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  hours: string
}

export interface CreateVehicleRequest {
  name: string
  categoryId: string
  transmission: Transmission
  fuelType: FuelType
  seats: number
  pricePerDay: number
  currency: string
  images?: string[]
  available?: boolean
}

export type UpdateVehicleRequest = Partial<CreateVehicleRequest>

export interface CreateCategoryRequest {
  name: string
}

export interface CreateBranchRequest {
  name: string
  address: string
  lat: number
  lng: number
  hours: string
}

/** Public browse filters (all optional). */
export interface VehicleFilters {
  providerId?: string
  categoryId?: string
  transmission?: Transmission
  fuelType?: FuelType
  minPrice?: number
  maxPrice?: number
  available?: boolean
}
