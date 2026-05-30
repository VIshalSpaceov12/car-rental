import { defaultTheme } from '@car-rental/tokens'

// Smoke test: proves the @car-rental/tokens workspace package resolves and
// transpiles inside the mobile (jest-expo) workspace.
test('shared tokens resolve in the mobile workspace', () => {
  expect(defaultTheme.color.primary).toBeTruthy()
  expect(typeof defaultTheme.spacing.md).toBe('number')
})
