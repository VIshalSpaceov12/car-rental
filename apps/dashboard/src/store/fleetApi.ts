import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  Branch,
  Category,
  CreateBranchRequest,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
} from '@car-rental/types'
import { API_URL } from '../api/config'
import type { RootState } from './store'

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
  tagTypes: ['Vehicle', 'Category', 'Branch'],
  endpoints: (b) => ({
    vehicles: b.query<Vehicle[], string | undefined>({
      query: (providerId) => (providerId ? `/vehicles?providerId=${providerId}` : '/vehicles'),
      providesTags: ['Vehicle'],
    }),
    createVehicle: b.mutation<Vehicle, CreateVehicleRequest>({
      query: (body) => ({ url: '/vehicles', method: 'POST', body }),
      invalidatesTags: ['Vehicle'],
    }),
    updateVehicle: b.mutation<Vehicle, { id: string; body: UpdateVehicleRequest }>({
      query: ({ id, body }) => ({ url: `/vehicles/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Vehicle'],
    }),
    deleteVehicle: b.mutation<void, string>({
      query: (id) => ({ url: `/vehicles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vehicle'],
    }),
    categories: b.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: b.mutation<Category, string>({
      query: (name) => ({ url: '/categories', method: 'POST', body: { name } }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: b.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
    branches: b.query<Branch[], void>({
      query: () => '/branches',
      providesTags: ['Branch'],
    }),
    createBranch: b.mutation<Branch, CreateBranchRequest>({
      query: (body) => ({ url: '/branches', method: 'POST', body }),
      invalidatesTags: ['Branch'],
    }),
    deleteBranch: b.mutation<void, string>({
      query: (id) => ({ url: `/branches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Branch'],
    }),
  }),
})

export const {
  useVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useBranchesQuery,
  useCreateBranchMutation,
  useDeleteBranchMutation,
} = fleetApi
