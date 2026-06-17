import { describe, it, expect } from 'vitest'
import { lightTheme } from '@car-rental/tokens'
import type { BookingStatus } from '@car-rental/types'
import { statusRole, roleColor, type ChipRole } from './StatusChip'

describe('StatusChip status→role mapping', () => {
  const cases: [BookingStatus, ChipRole][] = [
    ['reserved', 'warning'],
    ['vehicle-prepared', 'warning'],
    ['confirmed', 'success'],
    ['picked-up', 'primary'],
    ['completed', 'success'],
    ['returned', 'muted'],
    ['rejected', 'danger'],
    ['cancelled', 'danger'],
  ]

  it.each(cases)('maps %s → %s role', (status, role) => {
    expect(statusRole(status)).toBe(role)
  })

  it('resolves each role to the matching themed color', () => {
    expect(roleColor(lightTheme, 'success')).toBe(lightTheme.color.success)
    expect(roleColor(lightTheme, 'warning')).toBe(lightTheme.color.warning)
    expect(roleColor(lightTheme, 'danger')).toBe(lightTheme.color.danger)
    expect(roleColor(lightTheme, 'primary')).toBe(lightTheme.color.primary)
    expect(roleColor(lightTheme, 'muted')).toBe(lightTheme.color.textMuted)
  })
})
