import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Vehicle, VehicleFilters } from '@car-rental/types'
import { API_URL } from '../api'
import type { RootState } from './store'

function toQuery(f?: VehicleFilters): string {
  if (!f) return ''
  const p = new URLSearchParams()
  if (f.available !== undefined) p.set('available', String(f.available))
  if (f.categoryId) p.set('categoryId', f.categoryId)
  if (f.transmission) p.set('transmission', f.transmission)
  if (f.fuelType) p.set('fuelType', f.fuelType)
  if (f.maxPrice !== undefined) p.set('maxPrice', String(f.maxPrice))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const fleetApi = createApi({
  reducerPath: 'fleetApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (b) => ({
    vehicles: b.query<Vehicle[], VehicleFilters | undefined>({
      query: (filters) => `/vehicles${toQuery(filters)}`,
    }),
    vehicle: b.query<Vehicle, string>({
      query: (id) => `/vehicles/${id}`,
    }),
  }),
})

export const { useVehiclesQuery, useVehicleQuery } = fleetApi
