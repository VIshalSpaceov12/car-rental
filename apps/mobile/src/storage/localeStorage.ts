import * as SecureStore from 'expo-secure-store'
import type { Locale } from '@car-rental/types'

const KEY = 'car_rental_locale'

/** Persist the user's chosen UI language so it survives restarts. */
export async function saveLocale(locale: Locale): Promise<void> {
  await SecureStore.setItemAsync(KEY, locale)
}

/** Read the persisted locale, or `null` if the user never chose one. */
export async function loadLocale(): Promise<Locale | null> {
  const raw = await SecureStore.getItemAsync(KEY)
  return raw === 'en' || raw === 'ar' ? raw : null
}
