import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider, defaultTheme } from '@car-rental/tokens'
import type {
  BookingStatus,
  Contract,
  OtpIssueResponse,
  OtpSummary,
  ReturnInspection,
} from '@car-rental/types'
import { BookingPhase5Actions, type BookingPhase5ActionsProps } from './BookingPhase5Actions'

function renderActions(overrides: Partial<BookingPhase5ActionsProps> = {}) {
  const props: BookingPhase5ActionsProps = {
    status: 'vehicle-prepared' as BookingStatus,
    busy: false,
    issuedOtp: null,
    otpSummary: null,
    contract: null,
    inspection: null,
    onIssueOtp: vi.fn(),
    onViewContract: vi.fn(),
    onComplete: vi.fn(),
    ...overrides,
  }
  render(
    <ThemeProvider theme={defaultTheme}>
      <BookingPhase5Actions {...props} />
    </ThemeProvider>,
  )
  return props
}

const issuedOtp: OtpIssueResponse = {
  bookingId: 'b1',
  vehicleId: 'v1',
  otp: '482917',
  expiresAt: '2026-07-01T12:00:00.000Z',
}

const otpSummary: OtpSummary = {
  bookingId: 'b1',
  vehicleId: 'v1',
  status: 'issued',
  expiresAt: '2026-07-01T12:00:00.000Z',
  consumedAt: null,
}

const contract: Contract = {
  bookingId: 'b1',
  content: 'These are the rental terms.',
  signedAt: null,
  signerName: null,
  signedConsent: false,
}

const inspection: ReturnInspection = {
  bookingId: 'b1',
  condition: 'minor-damage',
  notes: 'Scratch on the rear bumper.',
  inspectedAt: '2026-07-05T10:00:00.000Z',
  inspectorId: 'staff1',
}

describe('BookingPhase5Actions', () => {
  it('offers Issue OTP and View contract for a vehicle-prepared booking', () => {
    renderActions({ status: 'vehicle-prepared' })
    expect(screen.getByRole('button', { name: /issue otp/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view contract/i })).toBeInTheDocument()
  })

  it('fires onIssueOtp when Issue OTP is clicked', () => {
    const { onIssueOtp } = renderActions({ status: 'vehicle-prepared' })
    fireEvent.click(screen.getByRole('button', { name: /issue otp/i }))
    expect(onIssueOtp).toHaveBeenCalledTimes(1)
  })

  it('displays the issued code, its expiry, and the tracking status', () => {
    renderActions({ status: 'vehicle-prepared', issuedOtp, otpSummary })
    expect(screen.getByText('482917')).toBeInTheDocument()
    expect(screen.getByText(/expires/i)).toBeInTheDocument()
    expect(screen.getByText(/otp status/i)).toBeInTheDocument()
    expect(screen.getByText(/issued/i)).toBeInTheDocument()
  })

  it('requests and shows the contract content + unsigned state when View contract is clicked', () => {
    const { onViewContract } = renderActions({ status: 'vehicle-prepared', contract })
    fireEvent.click(screen.getByRole('button', { name: /view contract/i }))
    expect(onViewContract).toHaveBeenCalledTimes(1)
    expect(screen.getByText('These are the rental terms.')).toBeInTheDocument()
    expect(screen.getByText(/not yet signed/i)).toBeInTheDocument()
  })

  it('shows the complete & inspect form only for a returned booking', () => {
    renderActions({ status: 'returned' })
    expect(screen.getByRole('button', { name: /complete & inspect/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /issue otp/i })).toBeNull()
  })

  it('submits the selected condition and notes via onComplete', () => {
    const { onComplete } = renderActions({ status: 'returned' })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'major-damage' } })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Dent on door' } })
    fireEvent.click(screen.getByRole('button', { name: /complete & inspect/i }))
    expect(onComplete).toHaveBeenCalledWith('major-damage', 'Dent on door')
  })

  it('renders the recorded inspection for a completed booking', () => {
    renderActions({ status: 'completed', inspection })
    expect(screen.getByText(/return inspection/i)).toBeInTheDocument()
    expect(screen.getByText(/minor damage/i)).toBeInTheDocument()
    expect(screen.getByText(/scratch on the rear bumper/i)).toBeInTheDocument()
  })

  it('renders nothing for a status with no Phase-5 action', () => {
    const { container } = render(
      <ThemeProvider theme={defaultTheme}>
        <BookingPhase5Actions
          status="reserved"
          busy={false}
          issuedOtp={null}
          otpSummary={null}
          contract={null}
          inspection={null}
          onIssueOtp={vi.fn()}
          onViewContract={vi.fn()}
          onComplete={vi.fn()}
        />
      </ThemeProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
