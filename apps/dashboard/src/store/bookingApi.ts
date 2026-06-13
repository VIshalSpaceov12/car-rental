import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Booking, BookingSummary, PrepareBookingRequest } from '@car-rental/types'
import { API_URL } from '../api/config'
import type { RootState } from './store'

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  tagTypes: ['Booking'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    getBookings: builder.query<BookingSummary[], void>({
      query: () => '/bookings',
      providesTags: ['Booking'],
    }),
    rejectBooking: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/provider-cancel`, method: 'POST' }),
      invalidatesTags: ['Booking'],
    }),
    prepareBooking: builder.mutation<Booking, { id: string; body: PrepareBookingRequest }>({
      query: ({ id, body }) => ({ url: `/bookings/${id}/prepare`, method: 'POST', body }),
      invalidatesTags: ['Booking'],
    }),
  }),
})

export const { useGetBookingsQuery, useRejectBookingMutation, useCancelBookingMutation, usePrepareBookingMutation } =
  bookingApi
