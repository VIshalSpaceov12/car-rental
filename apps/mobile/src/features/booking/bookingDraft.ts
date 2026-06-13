import type { CreateBookingRequest, QuoteRequest, RentalPlan } from '@car-rental/types'

/** Customer's in-progress booking selection. Dates are `YYYY-MM-DD` (what the UI collects). */
export interface BookingDraft {
  vehicleId: string | null
  plan: RentalPlan
  startDate: string
  endDate: string
  pickupBranchId: string | null
  dropoffBranchId: string | null
  discountCode: string
}

export const emptyDraft: BookingDraft = {
  vehicleId: null,
  plan: 'daily',
  startDate: '',
  endDate: '',
  pickupBranchId: null,
  dropoffBranchId: null,
  discountCode: '',
}

// Pickup defaults to mid-morning; the demo doesn't collect a time of day.
function toIso(date: string): string {
  return new Date(`${date}T10:00:00.000Z`).toISOString()
}

/** Today's date as `YYYY-MM-DD` in UTC — the floor a start date can't precede. */
function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** First validation error, or null if the draft is ready to quote/book. */
export function validateDraft(d: BookingDraft, now: Date = new Date()): string | null {
  if (!d.vehicleId) return 'Select a vehicle'
  if (!d.startDate || !d.endDate) return 'Choose start and end dates'
  const start = new Date(`${d.startDate}T10:00:00.000Z`).getTime()
  const end = new Date(`${d.endDate}T10:00:00.000Z`).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 'Enter valid dates (YYYY-MM-DD)'
  // Compare on calendar day (the UI only collects a date) so "today" is allowed.
  if (d.startDate < todayUtc(now)) return 'Start date cannot be in the past'
  if (end <= start) return 'End date must be after the start date'
  if (!d.pickupBranchId || !d.dropoffBranchId) return 'Choose pickup and drop-off branches'
  return null
}

// The two builders assume a draft that has passed validateDraft.
export function toQuoteRequest(d: BookingDraft): QuoteRequest {
  const code = d.discountCode.trim()
  return {
    vehicleId: d.vehicleId as string,
    plan: d.plan,
    startAt: toIso(d.startDate),
    endAt: toIso(d.endDate),
    ...(code ? { discountCode: code } : {}),
  }
}

export function toCreateRequest(d: BookingDraft): CreateBookingRequest {
  return {
    ...toQuoteRequest(d),
    pickupBranchId: d.pickupBranchId as string,
    dropoffBranchId: d.dropoffBranchId as string,
  }
}
