import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import {
  useCancelBookingMutation,
  useGetBookingsQuery,
  usePrepareBookingMutation,
  useRejectBookingMutation,
} from '../../store/bookingApi'
import { IncomingBookingsList, type ProviderBookingAction } from './IncomingBookingsList'
import { BookingPhase5Container } from './BookingPhase5Container'

/** Container: fetches the provider's incoming bookings and drives transitions. */
export function BookingsScreen() {
  const theme = useTheme()
  const { t } = useTranslation()
  const { data: bookings, isLoading, isError } = useGetBookingsQuery()
  const [reject] = useRejectBookingMutation()
  const [cancel] = useCancelBookingMutation()
  const [prepare] = usePrepareBookingMutation()
  const [busyId, setBusyId] = useState<string | null>(null)

  const onAction = async (id: string, action: ProviderBookingAction, prepReadyAt?: string) => {
    setBusyId(id)
    try {
      if (action === 'reject') await reject(id).unwrap()
      else if (action === 'cancel') await cancel(id).unwrap()
      else await prepare({ id, body: prepReadyAt ? { prepReadyAt } : {} }).unwrap()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.color.background, padding: theme.spacing.xl }}>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>{t('bookings.title')}</h1>
      {isLoading && <p style={{ color: theme.color.textMuted }}>{t('bookings.loading')}</p>}
      {isError && <p style={{ color: theme.color.danger }}>{t('bookings.loadFailed')}</p>}
      {bookings && (
        <IncomingBookingsList
          bookings={bookings}
          onAction={onAction}
          busyId={busyId}
          renderPhase5={(b) => <BookingPhase5Container id={b.id} status={b.status} />}
        />
      )}
    </div>
  )
}
