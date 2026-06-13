import type { Locale, UserRole } from './user'

/** Roles a user may self-register as (staff are created by a provider, not via signup). */
export type RegisterableRole = Extract<UserRole, 'customer' | 'service-provider'>

/**
 * Per-provider white-label branding. Config-driven (never hardcoded per tenant) and
 * resolved at runtime into the `@car-rental/tokens` theme via `createTheme(scheme, colors)`.
 */
export interface ProviderBranding {
  name: string
  logoUrl: string | null
  colors: {
    primary: string
    primaryDark?: string
    background?: string
  }
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: RegisterableRole
  phone?: string
  locale?: Locale
  /** Required when role is 'service-provider' — names the rental business (the tenant/provider). */
  businessName?: string
  /** Optional per-provider brand colors at signup; falls back to the platform default. */
  colors?: ProviderBranding['colors']
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  locale: Locale
  /** null for customers; the owning provider/tenant for providers and staff. */
  providerId: string | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
  /** The user's provider branding (present for provider/staff; null for customers without a tenant). */
  branding: ProviderBranding | null
}
