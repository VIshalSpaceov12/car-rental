import { BOOKING_STATUSES, type BookingStatus } from '@car-rental/types'
import { statusColorRole, statusColor } from './statusChipColor'
import { darkTheme } from '@car-rental/tokens'

describe('statusColorRole', () => {
  const cases: Array<[BookingStatus, ReturnType<typeof statusColorRole>]> = [
    ['reserved', 'warning'],
    ['vehicle-prepared', 'warning'],
    ['confirmed', 'success'],
    ['picked-up', 'primary'],
    ['completed', 'success'],
    ['returned', 'textMuted'],
    ['rejected', 'danger'],
    ['cancelled', 'danger'],
  ]

  it.each(cases)('maps %s -> %s', (status, role) => {
    expect(statusColorRole(status)).toBe(role)
  })

  it('covers every booking status (no missing case)', () => {
    for (const status of BOOKING_STATUSES) {
      expect(() => statusColorRole(status)).not.toThrow()
    }
  })

  it('statusColor resolves the role against the theme scheme', () => {
    expect(statusColor(darkTheme, 'rejected')).toBe(darkTheme.color.danger)
    expect(statusColor(darkTheme, 'completed')).toBe(darkTheme.color.success)
    expect(statusColor(darkTheme, 'picked-up')).toBe(darkTheme.color.primary)
    expect(statusColor(darkTheme, 'returned')).toBe(darkTheme.color.textMuted)
  })
})
