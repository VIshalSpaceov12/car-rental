import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Booking, BranchOption, CreateBookingRequest, Quote, QuoteRequest, Vehicle } from '@car-rental/types'
import { API_URL } from '../api'
import type { RootState } from './store'

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    getVehicles: builder.query<Vehicle[], void>({
      query: () => '/vehicles',
    }),
    getBranchOptions: builder.query<BranchOption[], string>({
      query: (vehicleId) => `/bookings/vehicles/${vehicleId}/branches`,
    }),
    quote: builder.mutation<Quote, QuoteRequest>({
      query: (body) => ({ url: '/bookings/quote', method: 'POST', body }),
    }),
    createBooking: builder.mutation<Booking, CreateBookingRequest>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
    }),
  }),
})

export const { useGetVehiclesQuery, useGetBranchOptionsQuery, useQuoteMutation, useCreateBookingMutation } = bookingApi
