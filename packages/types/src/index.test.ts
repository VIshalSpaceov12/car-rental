import { describe, it, expect } from 'vitest'
import { BOOKING_STATUSES, type BookingStatus } from './index'

describe('@car-rental/types', () => {
  it('exposes the authoritative booking lifecycle in order', () => {
    expect(BOOKING_STATUSES[0]).toBe('reserved')
    expect(BOOKING_STATUSES).toContain('confirmed')
    expect(BOOKING_STATUSES).toContain('completed')
  })

  it('derives BookingStatus from the const tuple', () => {
    const status: BookingStatus = 'picked-up'
    expect(BOOKING_STATUSES).toContain(status)
  })
})
