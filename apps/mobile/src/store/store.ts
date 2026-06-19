import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { fleetApi } from './fleetApi'
import { bookingApi } from './bookingApi'
import authReducer from './authSlice'
import favoritesReducer from './favoritesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    favorites: favoritesReducer,
    [authApi.reducerPath]: authApi.reducer,
    [fleetApi.reducerPath]: fleetApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(authApi.middleware, fleetApi.middleware, bookingApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
