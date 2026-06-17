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
import { useToast } from '../../components/Toast'
import { TitleRow } from '../../components/TitleRow'
import { Button } from '../../components/Button'

/** Plus glyph for the New-booking CTA (icon size from the token scale). */
function PlusIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

/** Container: fetches the provider's incoming bookings and drives transitions. */
export function BookingsScreen() {
  const theme = useTheme()
  const { t } = useTranslation()
  const toast = useToast()
  const { data: bookings, isLoading, isError } = useGetBookingsQuery()
  const [reject] = useRejectBookingMutation()
  const [cancel] = useCancelBookingMutation()
  const [prepare] = usePrepareBookingMutation()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionFailed, setActionFailed] = useState(false)

  const onAction = async (id: string, action: ProviderBookingAction, prepReadyAt?: string) => {
    setBusyId(id)
    setActionFailed(false)
    try {
      if (action === 'reject') {
        await reject(id).unwrap()
        toast.show(t('toast.bookingRejected'), 'success')
      } else if (action === 'cancel') {
        await cancel(id).unwrap()
        toast.show(t('toast.bookingCancelled'), 'success')
      } else {
        await prepare({ id, body: prepReadyAt ? { prepReadyAt } : {} }).unwrap()
        toast.show(t('toast.bookingPrepared'), 'success')
      }
    } catch {
      // A rejected transition (409 conflict, server error) must not leave the row
      // looking actionable with no feedback — surface it; the list refetches on success.
      setActionFailed(true)
      toast.show(t('toast.actionFailed'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <TitleRow
        title={t('bookings.title')}
        subtitle={t('bookings.subtitle')}
        action={
          <Button
            fullWidth={false}
            radius="pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: theme.typography.label.fontWeight,
            }}
          >
            <PlusIcon size={theme.size.icon.xs} />
            {t('bookings.newBooking')}
          </Button>
        }
      />
      {isLoading && <p style={{ color: theme.color.textMuted }}>{t('bookings.loading')}</p>}
      {isError && <p style={{ color: theme.color.danger }}>{t('bookings.loadFailed')}</p>}
      {actionFailed && <p style={{ color: theme.color.danger }}>{t('bookings.actionFailed')}</p>}
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
