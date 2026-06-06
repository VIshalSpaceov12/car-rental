import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { fleetApi } from './fleetApi'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [fleetApi.reducerPath]: fleetApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware, fleetApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
