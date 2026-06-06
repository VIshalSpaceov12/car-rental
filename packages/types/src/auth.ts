import type { Locale, UserRole } from './user'

/** Roles a user may self-register as (staff are created by a provider, not via signup). */
export type RegisterableRole = Extract<UserRole, 'customer' | 'service-provider'>

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: RegisterableRole
  phone?: string
  locale?: Locale
  /** Required when role is 'service-provider' — names the rental business (the tenant/provider). */
  businessName?: string
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
}
