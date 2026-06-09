import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider, defaultTheme } from '@car-rental/tokens'
import type { BookingSummary } from '@car-rental/types'
import { IncomingBookingsList } from './IncomingBookingsList'

const base: BookingSummary = {
  id: 'b1',
  customerId: 'c1',
  providerId: 'p1',
  vehicleId: 'v1',
  status: 'reserved',
  plan: 'daily',
  pickupBranchId: 'br1',
  dropoffBranchId: 'br2',
  startAt: '2026-07-01T10:00:00.000Z',
  endAt: '2026-07-04T10:00:00.000Z',
  subtotal: 360,
  discountCode: null,
  discountAmount: 0,
  tax: 18,
  total: 378,
  currency: 'AED',
  createdAt: '2026-06-01T00:00:00.000Z',
  vehicleName: 'Toyota Corolla',
  customerName: 'Demo Customer',
  pickupBranchName: 'Downtown',
  dropoffBranchName: 'Airport',
}

function renderList(bookings: BookingSummary[], onAction = vi.fn()) {
  render(
    <ThemeProvider theme={defaultTheme}>
      <IncomingBookingsList bookings={bookings} onAction={onAction} busyId={null} />
    </ThemeProvider>,
  )
  return onAction
}

describe('IncomingBookingsList', () => {
  it('shows the vehicle, customer and total for each booking', () => {
    renderList([base])
    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByText('Demo Customer')).toBeInTheDocument()
    expect(screen.getByText(/378/)).toBeInTheDocument()
  })

  it('offers Accept and Reject for a reserved booking, but not Prepare', () => {
    renderList([base])
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /prepare/i })).toBeNull()
  })

  it('offers Prepare for a confirmed booking, but not Accept', () => {
    renderList([{ ...base, status: 'confirmed' }])
    expect(screen.getByRole('button', { name: /prepare/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /accept/i })).toBeNull()
  })

  it('calls onAction with the booking id and action when Accept is clicked', () => {
    const onAction = renderList([base])
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAction).toHaveBeenCalledWith('b1', 'accept')
  })

  it('offers no action buttons for a terminal booking', () => {
    renderList([{ ...base, status: 'cancelled' }])
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows an empty state when there are no bookings', () => {
    renderList([])
    expect(screen.getByText(/no .* bookings/i)).toBeInTheDocument()
  })
})
