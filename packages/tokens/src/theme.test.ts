import { describe, it, expect } from 'vitest'
import { defaultTheme } from './theme'

describe('@car-rental/tokens', () => {
  it('defaultTheme satisfies the Theme contract', () => {
    expect(defaultTheme.color.primary).toBeTruthy()
    expect(defaultTheme.color.danger).toBeTruthy()
    expect(typeof defaultTheme.spacing.md).toBe('number')
    expect(defaultTheme.typography.heading.fontWeight).toBe('700')
  })
})
