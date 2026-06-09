import { describe, it, expect } from 'vitest'
import { canTransition } from './booking.lifecycle'

describe('canTransition (guarded booking lifecycle)', () => {
  it('allows reserved → confirmed / rejected / cancelled', () => {
    expect(canTransition('reserved', 'confirmed')).toBe(true)
    expect(canTransition('reserved', 'rejected')).toBe(true)
    expect(canTransition('reserved', 'cancelled')).toBe(true)
  })

  it('allows confirmed → vehicle-prepared and confirmed → cancelled', () => {
    expect(canTransition('confirmed', 'vehicle-prepared')).toBe(true)
    expect(canTransition('confirmed', 'cancelled')).toBe(true)
  })

  it('rejects skipping reserved straight to vehicle-prepared', () => {
    expect(canTransition('reserved', 'vehicle-prepared')).toBe(false)
  })

  it('rejects completing before the vehicle is returned', () => {
    expect(canTransition('vehicle-prepared', 'completed')).toBe(false)
    expect(canTransition('picked-up', 'completed')).toBe(false)
    expect(canTransition('returned', 'completed')).toBe(true)
  })

  it('rejects every transition out of a terminal state', () => {
    expect(canTransition('completed', 'reserved')).toBe(false)
    expect(canTransition('cancelled', 'confirmed')).toBe(false)
    expect(canTransition('rejected', 'reserved')).toBe(false)
  })

  it('rejects a no-op transition to the same state', () => {
    expect(canTransition('confirmed', 'confirmed')).toBe(false)
  })
})
