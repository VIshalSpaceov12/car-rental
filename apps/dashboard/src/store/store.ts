import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { bookingApi } from './bookingApi'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware, bookingApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
