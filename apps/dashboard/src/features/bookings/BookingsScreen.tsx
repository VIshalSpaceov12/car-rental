import { useState } from 'react'
import { useTheme } from '@car-rental/tokens'
import {
  useAcceptBookingMutation,
  useGetBookingsQuery,
  usePrepareBookingMutation,
  useRejectBookingMutation,
} from '../../store/bookingApi'
import { IncomingBookingsList, type ProviderBookingAction } from './IncomingBookingsList'

/** Container: fetches the provider's incoming bookings and drives transitions. */
export function BookingsScreen() {
  const theme = useTheme()
  const { data: bookings, isLoading, isError } = useGetBookingsQuery()
  const [accept] = useAcceptBookingMutation()
  const [reject] = useRejectBookingMutation()
  const [prepare] = usePrepareBookingMutation()
  const [busyId, setBusyId] = useState<string | null>(null)

  const onAction = async (id: string, action: ProviderBookingAction) => {
    setBusyId(id)
    try {
      if (action === 'accept') await accept(id).unwrap()
      else if (action === 'reject') await reject(id).unwrap()
      else await prepare(id).unwrap()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.color.background, padding: theme.spacing.xl }}>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>Incoming Bookings</h1>
      {isLoading && <p style={{ color: theme.color.textMuted }}>Loading…</p>}
      {isError && <p style={{ color: theme.color.danger }}>Failed to load bookings.</p>}
      {bookings && <IncomingBookingsList bookings={bookings} onAction={onAction} busyId={busyId} />}
    </div>
  )
}
