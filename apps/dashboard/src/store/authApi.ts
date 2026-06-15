import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  ProviderBranding,
  RegisterRequest,
  UpdateBrandingRequest,
} from '@car-rental/types'
import { API_URL } from '../api/config'
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
    me: builder.query<{ user: AuthUser; branding: ProviderBranding | null }, void>({
      query: () => '/auth/me',
    }),
    updateBranding: builder.mutation<ProviderBranding, UpdateBrandingRequest>({
      query: (body) => ({ url: '/branding', method: 'PATCH', body }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useMeQuery, useUpdateBrandingMutation } =
  authApi
