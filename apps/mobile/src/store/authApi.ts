import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { AuthResponse, LoginRequest, ProviderBranding, RegisterRequest } from '@car-rental/types'
import { API_URL } from '../api'
import type { RootState } from './store'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    // Single-brand app: the provider's white-label branding for runtime theming.
    branding: builder.query<ProviderBranding, void>({
      query: () => '/branding',
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useBrandingQuery } = authApi
