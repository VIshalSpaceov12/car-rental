import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  Contract,
  OtpIssueResponse,
  OtpSummary,
  Rating,
  ReturnInspection,
} from '@car-rental/types'
import { API_URL } from '../api/config'
import type { RootState } from './store'

/**
 * Phase 5: keyless lock-box (OTP), digital contract, and return inspection.
 * Per-booking reads tagged by id so a single issuance/completion only refetches
 * that booking's data. The `returned → completed` transition itself lives in
 * `bookingApi` (so it can invalidate the booking list — RTK Query tags are
 * scoped per-API instance); on complete the screen also refetches the inspection.
 */
export const phase5Api = createApi({
  reducerPath: 'phase5Api',
  tagTypes: ['Otp', 'Inspection', 'Rating'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    issueOtp: builder.mutation<OtpIssueResponse, string>({
      query: (bookingId) => ({ url: `/otps/${bookingId}/issue`, method: 'POST' }),
      invalidatesTags: (_r, _e, bookingId) => [{ type: 'Otp', id: bookingId }],
    }),
    // 404 (no OTP issued yet) is expected before issuance — callers treat the
    // error as "not issued" rather than a failure.
    getOtp: builder.query<OtpSummary, string>({
      query: (bookingId) => `/otps/${bookingId}`,
      providesTags: (_r, _e, bookingId) => [{ type: 'Otp', id: bookingId }],
    }),
    getContract: builder.query<Contract, string>({
      query: (bookingId) => `/contracts/${bookingId}`,
    }),
    // 404 (no inspection) is expected until the booking is completed.
    getInspection: builder.query<ReturnInspection, string>({
      query: (id) => `/bookings/${id}/inspection`,
      providesTags: (_r, _e, id) => [{ type: 'Inspection', id }],
    }),
    // 404 (not rated yet) is expected — the customer rates *after* completion,
    // so callers treat the error as "not rated yet" rather than a failure.
    getRating: builder.query<Rating, string>({
      query: (bookingId) => `/bookings/${bookingId}/rating`,
      providesTags: (_r, _e, bookingId) => [{ type: 'Rating', id: bookingId }],
    }),
  }),
})

export const {
  useIssueOtpMutation,
  useGetOtpQuery,
  useGetContractQuery,
  useGetInspectionQuery,
  useGetRatingQuery,
} = phase5Api
