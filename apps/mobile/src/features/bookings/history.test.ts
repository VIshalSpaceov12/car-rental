import type { BookingStatus, BookingSummary } from '@car-rental/types'
import { activeBookings, isTerminal, pastBookings, receiptLines } from './history'

/** Minimal summary factory — only the fields these helpers read. */
function summary(over: Partial<BookingSummary> & { id: string; status: BookingStatus }): BookingSummary {
  return {
    customerId: 'cust-1',
    providerId: 'prov-1',
    vehicleId: 'veh-1',
    plan: 'daily',
    pickupBranchId: 'b-1',
    dropoffBranchId: 'b-1',
    startAt: '2026-01-01T10:00:00.000Z',
    endAt: '2026-01-04T10:00:00.000Z',
    subtotal: 300,
    discountCode: null,
    discountAmount: 0,
    tax: 15,
    total: 315,
    currency: 'AED',
    prepReadyAt: null,
    createdAt: '2026-01-01T09:00:00.000Z',
    vehicleName: 'Corolla',
    customerName: 'Sam',
    pickupBranchName: 'Downtown',
    dropoffBranchName: 'Downtown',
    paymentStatus: 'paid',
    ...over,
  }
}

describe('isTerminal', () => {
  it('treats completed/cancelled/rejected as terminal', () => {
    expect(isTerminal('completed')).toBe(true)
    expect(isTerminal('cancelled')).toBe(true)
    expect(isTerminal('rejected')).toBe(true)
  })

  it('treats in-flight states as non-terminal', () => {
    expect(isTerminal('reserved')).toBe(false)
    expect(isTerminal('picked-up')).toBe(false)
    expect(isTerminal('returned')).toBe(false)
  })
})

describe('pastBookings / activeBookings', () => {
  const bookings = [
    summary({ id: 'a', status: 'completed', startAt: '2026-03-01T10:00:00.000Z' }),
    summary({ id: 'b', status: 'picked-up', startAt: '2026-04-01T10:00:00.000Z' }),
    summary({ id: 'c', status: 'cancelled', startAt: '2026-05-01T10:00:00.000Z' }),
    summary({ id: 'd', status: 'confirmed', startAt: '2026-02-01T10:00:00.000Z' }),
  ]

  it('partitions terminal vs in-flight bookings', () => {
    expect(pastBookings(bookings).map((b) => b.id)).toEqual(['c', 'a'])
    expect(activeBookings(bookings).map((b) => b.id)).toEqual(['b', 'd'])
  })

  it('sorts each partition newest-first by start date', () => {
    expect(pastBookings(bookings)[0]?.id).toBe('c') // May before March
    expect(activeBookings(bookings)[0]?.id).toBe('b') // April before February
  })
})

describe('receiptLines', () => {
  it('omits the discount line when nothing was discounted', () => {
    const lines = receiptLines(summary({ id: 'a', status: 'completed' }))
    expect(lines.map((l) => l.key)).toEqual(['subtotal', 'tax', 'total'])
  })

  it('includes a negative discount line when a discount applied', () => {
    const lines = receiptLines(
      summary({ id: 'a', status: 'completed', discountAmount: 30, total: 285 }),
    )
    expect(lines.map((l) => l.key)).toEqual(['subtotal', 'discount', 'tax', 'total'])
    expect(lines.find((l) => l.key === 'discount')?.amount).toBe(-30)
    expect(lines.find((l) => l.key === 'total')?.amount).toBe(285)
  })
})
