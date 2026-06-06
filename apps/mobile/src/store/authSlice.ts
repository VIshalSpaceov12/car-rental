import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse, AuthUser } from '@car-rental/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  // false until SecureStore has been read on app start (avoids an auth flash).
  hydrated: boolean
}

const initialState: AuthState = { token: null, user: null, hydrated: false }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.token = action.payload.token
      state.user = action.payload.user
    },
    logout: (state) => {
      state.token = null
      state.user = null
    },
    hydrate: (state, action: PayloadAction<AuthResponse | null>) => {
      if (action.payload) {
        state.token = action.payload.token
        state.user = action.payload.user
      }
      state.hydrated = true
    },
  },
})

export const { setCredentials, logout, hydrate } = authSlice.actions
export default authSlice.reducer
