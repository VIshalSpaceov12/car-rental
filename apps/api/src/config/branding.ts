import type { ProviderBranding } from '@car-rental/types'

/**
 * Platform default white-label brand + business policy. Used when a provider
 * self-registers without supplying its own `colors`, and as the fallback brand
 * for `GET /branding`. White-label rule: nothing brand-specific is hardcoded in
 * the auth flow — it reads from here (or the request) and persists per provider.
 */
export const DEFAULT_PROVIDER_BRAND: {
  colors: NonNullable<ProviderBranding['colors']>
  cancellationPolicy: string
} = {
  colors: { primary: '#E5322B', primaryDark: '#C9261E', background: '#0A0A0B' },
  cancellationPolicy: 'Free cancellation up to 24h before pickup.',
}
