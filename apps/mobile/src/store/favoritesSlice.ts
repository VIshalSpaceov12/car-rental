import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { toggleId } from './favoritesLogic'

interface FavoritesState {
  /** Favorited vehicle ids, most-recently-saved first. */
  ids: string[]
  // false until SecureStore has been read on app start (so we don't persist []
  // over the stored list before it loads).
  hydrated: boolean
}

const initialState: FavoritesState = { ids: [], hydrated: false }

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      state.ids = toggleId(state.ids, action.payload)
    },
    hydrateFavorites: (state, action: PayloadAction<string[]>) => {
      state.ids = action.payload
      state.hydrated = true
    },
  },
})

export const { toggleFavorite, hydrateFavorites } = favoritesSlice.actions
export default favoritesSlice.reducer
