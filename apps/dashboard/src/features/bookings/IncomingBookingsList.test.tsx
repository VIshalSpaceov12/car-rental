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
  prepReadyAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  vehicleName: 'Toyota Corolla',
  customerName: 'Demo Customer',
  pickupBranchName: 'Downtown',
  dropoffBranchName: 'Airport',
  paymentStatus: null,
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

  it('offers Reject and Cancel for a reserved booking, but never Accept or Prepare', () => {
    renderList([base])
    // Provider no longer confirms — reserved → confirmed is driven by customer payment.
    expect(screen.queryByRole('button', { name: /accept/i })).toBeNull()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /prepare/i })).toBeNull()
  })

  it('offers Prepare and Cancel for a confirmed booking, but never Accept or Reject', () => {
    renderList([{ ...base, status: 'confirmed' }])
    expect(screen.getByRole('button', { name: /prepare/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /accept/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reject/i })).toBeNull()
  })

  it('calls onAction with the booking id and action when Reject is clicked', () => {
    const onAction = renderList([base])
    fireEvent.click(screen.getByRole('button', { name: /reject/i }))
    expect(onAction).toHaveBeenCalledWith('b1', 'reject')
  })

  it('renders the payment status chip next to the booking status', () => {
    renderList([{ ...base, paymentStatus: 'paid' }])
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('renders a dash for a booking with no payment recorded yet', () => {
    renderList([base])
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('offers no action buttons for a terminal booking', () => {
    renderList([{ ...base, status: 'cancelled' }])
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows an empty state when there are no bookings', () => {
    renderList([])
    expect(screen.getByText(/no .* bookings/i)).toBeInTheDocument()
  })

  it('hides terminal bookings from the default Incoming filter, shows them under All', () => {
    renderList([{ ...base, status: 'completed' }])
    // Default "incoming" filter hides the completed booking.
    expect(screen.queryByText('Toyota Corolla')).toBeNull()
    // Switching to "all" reveals it.
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } })
    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument()
  })

  it('sends prepReadyAt (ISO) when a datetime is set before Prepare', () => {
    const onAction = renderList([{ ...base, status: 'confirmed' }])
    const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-07-01T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: /prepare/i }))
    expect(onAction).toHaveBeenCalledWith('b1', 'prepare', new Date('2026-07-01T09:00').toISOString())
  })

  it('displays the stored prepReadyAt on a vehicle-prepared booking', () => {
    renderList([{ ...base, status: 'vehicle-prepared', prepReadyAt: '2026-07-01T09:00:00.000Z' }])
    expect(screen.getByText(/ready at/i)).toBeInTheDocument()
  })
})
