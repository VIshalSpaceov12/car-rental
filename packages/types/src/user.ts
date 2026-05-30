export type UserRole = 'customer' | 'service-provider' | 'staff'

export type Locale = 'en' | 'ar'

export interface User {
  id: string
  role: UserRole
  email: string
  name: string
  locale: Locale
  /** ISO 8601 */
  createdAt: string
}
