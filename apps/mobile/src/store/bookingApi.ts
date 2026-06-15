import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  Booking,
  BookingSummary,
  BranchOption,
  Contract,
  ContractSignRequest,
  CreateBookingRequest,
  OtpVerifyRequest,
  OtpVerifyResponse,
  PayRequest,
  Payment,
  Quote,
  QuoteRequest,
} from '@car-rental/types'
import { API_URL } from '../api'
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
    getBranchOptions: builder.query<BranchOption[], string>({
      query: (vehicleId) => `/bookings/vehicles/${vehicleId}/branches`,
    }),
    quote: builder.mutation<Quote, QuoteRequest>({
      query: (body) => ({ url: '/bookings/quote', method: 'POST', body }),
    }),
    createBooking: builder.mutation<Booking, CreateBookingRequest>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Booking'],
    }),
    pay: builder.mutation<Payment, { bookingId: string; body: PayRequest }>({
      query: ({ bookingId, body }) => ({
        url: `/payments/${bookingId}/pay`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Booking'],
    }),
    // Phase 5 — keyless pickup & return.
    // The customer enters the OTP they received out-of-band; we never fetch the
    // plaintext code, only verify what they typed.
    verifyOtp: builder.mutation<OtpVerifyResponse, OtpVerifyRequest>({
      query: (body) => ({ url: '/otps/verify', method: 'POST', body }),
    }),
    getContract: builder.query<Contract, string>({
      query: (bookingId) => `/contracts/${bookingId}`,
    }),
    signContract: builder.mutation<Contract, { bookingId: string; body: ContractSignRequest }>({
      query: ({ bookingId, body }) => ({
        url: `/contracts/${bookingId}/sign`,
        method: 'POST',
        body,
      }),
      // Signing moves the booking vehicle-prepared → picked-up.
      invalidatesTags: ['Booking'],
    }),
    returnVehicle: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/return`, method: 'POST' }),
      invalidatesTags: ['Booking'],
    }),
  }),
})

export const {
  useGetBookingsQuery,
  useGetBranchOptionsQuery,
  useQuoteMutation,
  useCreateBookingMutation,
  useCancelBookingMutation,
  usePayMutation,
  useVerifyOtpMutation,
  useGetContractQuery,
  useSignContractMutation,
  useReturnVehicleMutation,
} = bookingApi
