import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { fleetApi } from './fleetApi'
import { bookingApi } from './bookingApi'
import { phase5Api } from './phase5Api'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [fleetApi.reducerPath]: fleetApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
    [phase5Api.reducerPath]: phase5Api.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(authApi.middleware, fleetApi.middleware, bookingApi.middleware, phase5Api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
