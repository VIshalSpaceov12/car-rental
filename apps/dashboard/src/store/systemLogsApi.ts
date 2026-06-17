import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { SystemLogQuery, SystemLogsResponse } from '@car-rental/types'
import { API_URL } from '../api/config'
import type { RootState } from './store'

/** Live application/system logs (in-memory on the API). Read-only + clear. */
export const systemLogsApi = createApi({
  reducerPath: 'systemLogsApi',
  tagTypes: ['SystemLog'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    systemLogs: builder.query<SystemLogsResponse, SystemLogQuery | void>({
      query: (q) => {
        const params = new URLSearchParams()
        if (q?.level) params.set('level', q.level)
        if (q?.limit != null) params.set('limit', String(q.limit))
        if (q?.minutes != null) params.set('minutes', String(q.minutes))
        const qs = params.toString()
        return `/system-logs${qs ? `?${qs}` : ''}`
      },
      providesTags: ['SystemLog'],
    }),
    clearSystemLogs: builder.mutation<{ message: string; clearedAt: string }, void>({
      query: () => ({ url: '/system-logs/clear', method: 'POST' }),
      invalidatesTags: ['SystemLog'],
    }),
  }),
})

export const { useSystemLogsQuery, useClearSystemLogsMutation } = systemLogsApi
