import * as SecureStore from 'expo-secure-store'
import type { AuthResponse } from '@car-rental/types'

const KEY = 'car_rental_auth'

export async function saveAuth(auth: AuthResponse): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(auth))
}

export async function loadAuth(): Promise<AuthResponse | null> {
  const raw = await SecureStore.getItemAsync(KEY)
  return raw ? (JSON.parse(raw) as AuthResponse) : null
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY)
}
