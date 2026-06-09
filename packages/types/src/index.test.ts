import { describe, it, expect } from 'vitest'
import { BOOKING_STATUSES, BOOKING_TRANSITIONS, type BookingStatus } from './index'

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

  it('defines an allowed-transition list for every status', () => {
    for (const status of BOOKING_STATUSES) {
      expect(BOOKING_TRANSITIONS[status]).toBeDefined()
    }
  })

  it('only lists real statuses as transition targets', () => {
    for (const targets of Object.values(BOOKING_TRANSITIONS)) {
      for (const target of targets) expect(BOOKING_STATUSES).toContain(target)
    }
  })

  it('makes completed/rejected/cancelled terminal (no outgoing transitions)', () => {
    expect(BOOKING_TRANSITIONS.completed).toEqual([])
    expect(BOOKING_TRANSITIONS.rejected).toEqual([])
    expect(BOOKING_TRANSITIONS.cancelled).toEqual([])
  })

  it('routes the demo lifecycle: reserved → confirmed → vehicle-prepared', () => {
    expect(BOOKING_TRANSITIONS.reserved).toContain('confirmed')
    expect(BOOKING_TRANSITIONS.reserved).toContain('rejected')
    expect(BOOKING_TRANSITIONS.confirmed).toContain('vehicle-prepared')
  })
})
