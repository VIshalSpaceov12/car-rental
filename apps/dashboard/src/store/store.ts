import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { fleetApi } from './fleetApi'
import { bookingApi } from './bookingApi'
import { phase5Api } from './phase5Api'
import { systemLogsApi } from './systemLogsApi'
import authReducer, { logout } from './authSlice'

// On logout, wipe every RTK Query cache. Otherwise a different provider signing in
// on the same device would see the previous session's cached fleet, bookings and
// contracts — and the issued-OTP plaintext held in phase5Api's mutation cache —
// until each query happened to refetch. resetApiState() clears it synchronously.
const logoutListener = createListenerMiddleware()
logoutListener.startListening({
  actionCreator: logout,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(authApi.util.resetApiState())
    listenerApi.dispatch(fleetApi.util.resetApiState())
    listenerApi.dispatch(bookingApi.util.resetApiState())
    listenerApi.dispatch(phase5Api.util.resetApiState())
    listenerApi.dispatch(systemLogsApi.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [fleetApi.reducerPath]: fleetApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
    [phase5Api.reducerPath]: phase5Api.reducer,
    [systemLogsApi.reducerPath]: systemLogsApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .prepend(logoutListener.middleware)
      .concat(
        authApi.middleware,
        fleetApi.middleware,
        bookingApi.middleware,
        phase5Api.middleware,
        systemLogsApi.middleware,
      ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
