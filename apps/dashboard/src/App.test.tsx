import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { App } from './App'

describe('dashboard App', () => {
  it('renders the heading using shared tokens', () => {
    render(<App />)
    expect(screen.getByText('Car Rental — dashboard')).toBeInTheDocument()
  })
})
