import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ThemeProvider, defaultTheme } from '@car-rental/tokens'
import type { Rating } from '@car-rental/types'
import { RatingDisplay } from './RatingDisplay'

function renderDisplay(rating: Rating | null) {
  render(
    <ThemeProvider theme={defaultTheme}>
      <RatingDisplay rating={rating} />
    </ThemeProvider>,
  )
}

const rating: Rating = {
  bookingId: 'b1',
  vehicleRating: 4,
  serviceRating: 5,
  comment: 'Smooth pickup, clean car.',
  createdAt: '2026-07-06T10:00:00.000Z',
}

describe('RatingDisplay', () => {
  it('shows the vehicle and service scores out of 5', () => {
    renderDisplay(rating)
    expect(screen.getByText(/customer rating/i)).toBeInTheDocument()
    expect(screen.getByText('Vehicle: 4/5')).toBeInTheDocument()
    expect(screen.getByText('Service: 5/5')).toBeInTheDocument()
  })

  it('shows the comment when present', () => {
    renderDisplay(rating)
    expect(screen.getByText(/smooth pickup, clean car\./i)).toBeInTheDocument()
  })

  it('omits the comment line when there is none', () => {
    renderDisplay({ ...rating, comment: null })
    expect(screen.getByText('Vehicle: 4/5')).toBeInTheDocument()
    expect(screen.queryByText(/comment:/i)).toBeNull()
  })

  it('shows a "not rated yet" state when no rating exists (404)', () => {
    renderDisplay(null)
    expect(screen.getByText(/not rated yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/vehicle:/i)).toBeNull()
  })
})
