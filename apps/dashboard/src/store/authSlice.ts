import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse, AuthUser, ProviderBranding } from '@car-rental/types'

const TOKEN_KEY = 'car_rental_token'
const USER_KEY = 'car_rental_user'
const BRANDING_KEY = 'car_rental_branding'

interface AuthState {
  token: string | null
  user: AuthUser | null
  /** Per-provider white-label branding; resolves the runtime theme + app name. */
  branding: ProviderBranding | null
}

function loadInitial(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const userRaw = localStorage.getItem(USER_KEY)
    const brandingRaw = localStorage.getItem(BRANDING_KEY)
    return {
      token,
      user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
      branding: brandingRaw ? (JSON.parse(brandingRaw) as ProviderBranding) : null,
    }
  } catch {
    return { token: null, user: null, branding: null }
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitial(),
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.branding = action.payload.branding
      localStorage.setItem(TOKEN_KEY, action.payload.token)
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
      if (action.payload.branding) {
        localStorage.setItem(BRANDING_KEY, JSON.stringify(action.payload.branding))
      } else {
        localStorage.removeItem(BRANDING_KEY)
      }
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.branding = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(BRANDING_KEY)
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
