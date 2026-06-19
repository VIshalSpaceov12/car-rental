import * as SecureStore from 'expo-secure-store'

const KEY = 'car_rental_favorites'

/** Persist the favorited vehicle ids so they survive restarts. */
export async function saveFavorites(ids: string[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(ids))
}

/** Read the persisted favorite ids (empty array if none / unparseable). */
export async function loadFavorites(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(KEY)
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
