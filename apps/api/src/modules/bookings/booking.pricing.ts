import type { Quote, QuoteRequest } from '@car-rental/types'

const MS_PER_DAY = 86_400_000

/**
 * Demo discount codes → fraction off the subtotal. A real implementation would
 * read these from the provider's promotions table (P-8/P-13); the demo keeps a
 * small in-memory map so checkout has something to apply. Codes are uppercased.
 */
const DEMO_DISCOUNTS: Record<string, number> = {
  WELCOME10: 0.1,
  SUMMER15: 0.15,
}

/** Round to 2 decimal places (currency minor units). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

interface VehiclePricing {
  pricePerDay: number
}

interface ProviderPricing {
  taxRatePct: number
  /** Keyed by wire RentalPlan, e.g. { daily: 1, weekly: 0.9, ... }. */
  planMultipliers: Record<string, number>
  minRentalDays: number
  currency: string
}

/**
 * Pure pricing: billable days × per-day rate × plan multiplier, then discount,
 * then tax. Server-authoritative — the client never sends amounts.
 */
export function computeQuote(req: QuoteRequest, vehicle: VehiclePricing, settings: ProviderPricing): Quote {
  const rawDays = Math.ceil((new Date(req.endAt).getTime() - new Date(req.startAt).getTime()) / MS_PER_DAY)
  const days = Math.max(settings.minRentalDays, rawDays)

  const planMultiplier = settings.planMultipliers[req.plan] ?? 1
  const subtotal = round2(vehicle.pricePerDay * days * planMultiplier)

  const code = req.discountCode?.trim().toUpperCase()
  const fraction = code ? DEMO_DISCOUNTS[code] : undefined
  const discountCode = fraction !== undefined ? code! : null
  const discountAmount = fraction !== undefined ? round2(subtotal * fraction) : 0

  const taxableBase = subtotal - discountAmount
  const tax = round2((taxableBase * settings.taxRatePct) / 100)
  const total = round2(taxableBase + tax)

  return {
    vehicleId: req.vehicleId,
    plan: req.plan,
    startAt: req.startAt,
    endAt: req.endAt,
    days,
    pricePerDay: vehicle.pricePerDay,
    planMultiplier,
    subtotal,
    discountCode,
    discountAmount,
    taxRatePct: settings.taxRatePct,
    tax,
    total,
    currency: settings.currency,
  }
}
