import type { Locale as DbLocale, Provider, UserRole as DbUserRole, User } from '@prisma/client'
import type { AuthUser, Locale, ProviderBranding, UserRole } from '@car-rental/types'

// DB enums are UPPER_SNAKE; wire strings are kebab/lowercase. Map at this boundary.
export const ROLE_TO_DB: Record<UserRole, DbUserRole> = {
  customer: 'CUSTOMER',
  'service-provider': 'SERVICE_PROVIDER',
  staff: 'STAFF',
}

const ROLE_TO_WIRE: Record<DbUserRole, UserRole> = {
  CUSTOMER: 'customer',
  SERVICE_PROVIDER: 'service-provider',
  STAFF: 'staff',
}

export const LOCALE_TO_DB: Record<Locale, DbLocale> = { en: 'EN', ar: 'AR' }

const LOCALE_TO_WIRE: Record<DbLocale, Locale> = { EN: 'en', AR: 'ar' }

export function toAuthUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: ROLE_TO_WIRE[u.role],
    locale: LOCALE_TO_WIRE[u.locale],
    providerId: u.providerId,
  }
}

/** Map a Provider row to the wire branding contract (`colors` is stored as JSON). */
export function toProviderBranding(p: Provider): ProviderBranding {
  return {
    name: p.name,
    logoUrl: p.logoUrl,
    colors: p.colors as ProviderBranding['colors'],
  }
}
