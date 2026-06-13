import { describe, it, expect } from 'vitest'
import { computeQuote } from './booking.pricing'

const settings = {
  taxRatePct: 5,
  planMultipliers: { daily: 1, weekly: 0.9, monthly: 0.8, 'long-term': 0.7 },
  minRentalDays: 1,
  currency: 'AED',
}

describe('computeQuote', () => {
  it('prices a 3-day daily rental with tax and no discount', () => {
    const q = computeQuote(
      { vehicleId: 'v1', plan: 'daily', startAt: '2026-07-01T10:00:00.000Z', endAt: '2026-07-04T10:00:00.000Z' },
      { pricePerDay: 120 },
      settings,
    )
    expect(q.days).toBe(3)
    expect(q.planMultiplier).toBe(1)
    expect(q.subtotal).toBe(360)
    expect(q.discountCode).toBeNull()
    expect(q.discountAmount).toBe(0)
    expect(q.tax).toBe(18)
    expect(q.total).toBe(378)
    expect(q.currency).toBe('AED')
  })

  it('applies the weekly plan multiplier', () => {
    const q = computeQuote(
      { vehicleId: 'v1', plan: 'weekly', startAt: '2026-07-01T00:00:00.000Z', endAt: '2026-07-08T00:00:00.000Z' },
      { pricePerDay: 100 },
      settings,
    )
    expect(q.days).toBe(7)
    expect(q.planMultiplier).toBe(0.9)
    expect(q.subtotal).toBe(630)
    expect(q.tax).toBe(31.5)
    expect(q.total).toBe(661.5)
  })

  it('floors a same-instant span at minRentalDays', () => {
    const q = computeQuote(
      { vehicleId: 'v1', plan: 'daily', startAt: '2026-07-01T10:00:00.000Z', endAt: '2026-07-01T10:00:00.000Z' },
      { pricePerDay: 200 },
      settings,
    )
    expect(q.days).toBe(1)
  })

  it('reports the pre-floor requestedDays and flags when minRentalDays raises the charge', () => {
    const floored = { ...settings, minRentalDays: 3 }
    // 1-day span billed at the 3-day floor → flag set, requestedDays preserves the selection.
    const raised = computeQuote(
      { vehicleId: 'v1', plan: 'daily', startAt: '2026-07-01T10:00:00.000Z', endAt: '2026-07-02T10:00:00.000Z' },
      { pricePerDay: 100 },
      floored,
    )
    expect(raised.requestedDays).toBe(1)
    expect(raised.days).toBe(3)
    expect(raised.minRentalDaysApplied).toBe(true)

    // A span at/above the floor is not raised.
    const notRaised = computeQuote(
      { vehicleId: 'v1', plan: 'daily', startAt: '2026-07-01T10:00:00.000Z', endAt: '2026-07-05T10:00:00.000Z' },
      { pricePerDay: 100 },
      floored,
    )
    expect(notRaised.requestedDays).toBe(4)
    expect(notRaised.days).toBe(4)
    expect(notRaised.minRentalDaysApplied).toBe(false)
  })

  it('rounds a 25-hour rental up to 2 days', () => {
    const q = computeQuote(
      { vehicleId: 'v1', plan: 'daily', startAt: '2026-07-01T00:00:00.000Z', endAt: '2026-07-02T01:00:00.000Z' },
      { pricePerDay: 200 },
      settings,
    )
    expect(q.days).toBe(2)
  })

  it('applies a valid discount code before tax (case-insensitive)', () => {
    const q = computeQuote(
      {
        vehicleId: 'v1',
        plan: 'daily',
        startAt: '2026-07-01T00:00:00.000Z',
        endAt: '2026-07-04T00:00:00.000Z',
        discountCode: 'welcome10',
      },
      { pricePerDay: 120 },
      settings,
    )
    expect(q.subtotal).toBe(360)
    expect(q.discountCode).toBe('WELCOME10')
    expect(q.discountAmount).toBe(36)
    expect(q.tax).toBe(16.2) // (360 - 36) * 0.05
    expect(q.total).toBe(340.2)
  })

  it('ignores an unknown discount code', () => {
    const q = computeQuote(
      {
        vehicleId: 'v1',
        plan: 'daily',
        startAt: '2026-07-01T00:00:00.000Z',
        endAt: '2026-07-02T00:00:00.000Z',
        discountCode: 'NOPE',
      },
      { pricePerDay: 100 },
      settings,
    )
    expect(q.discountCode).toBeNull()
    expect(q.discountAmount).toBe(0)
  })
})
