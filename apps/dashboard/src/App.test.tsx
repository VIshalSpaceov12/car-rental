import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { App } from './App'

describe('dashboard App', () => {
  beforeEach(() => localStorage.clear())

  it('shows the provider sign-in screen when unauthenticated', () => {
    render(<App />)
    expect(screen.getByText('Provider Sign In')).toBeInTheDocument()
  })
})
