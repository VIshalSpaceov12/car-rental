import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTheme, type Theme } from '@car-rental/tokens'
import {
  BOOKING_TRANSITIONS,
  type BookingStatus,
  type BookingSummary,
  type PaymentStatus,
} from '@car-rental/types'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/Button'
import type { RootStackParamList } from '../../navigation/types'
import { useCancelBookingMutation, useGetBookingsQuery } from '../../store/bookingApi'
import { activeBookings, pastBookings } from './history'

type Nav = NativeStackNavigationProp<RootStackParamList>

/** Customer's cancel action is offered only where the lifecycle allows it. */
const canCancel = (status: BookingStatus) => BOOKING_TRANSITIONS[status].includes('cancelled')

const statusColor = (theme: Theme, status: BookingStatus): string => {
  if (status === 'rejected' || status === 'cancelled') return theme.color.danger
  if (status === 'completed' || status === 'returned' || status === 'confirmed') return theme.color.success
  return theme.color.textMuted
}

const paymentStatusColor = (theme: Theme, status: PaymentStatus): string => {
  if (status === 'paid') return theme.color.success
  if (status === 'failed') return theme.color.danger
  if (status === 'pending') return theme.color.warning
  return theme.color.textMuted // refunded
}

/** YYYY-MM-DD slice of an ISO timestamp for compact display. */
const day = (iso: string) => iso.slice(0, 10)

export function BookingsScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { data: bookings, isLoading, isError, refetch } = useGetBookingsQuery()
  const [cancelBooking, cancelling] = useCancelBookingMutation()

  const onCancel = async (id: string) => {
    try {
      await cancelBooking(id).unwrap()
    } catch {
      // The list keeps the current status; the row stays cancellable to retry.
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.color.primary} />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.background, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text style={{ color: theme.color.danger, textAlign: 'center' }}>{t('bookings.loadError')}</Text>
        <Button title={t('common.retry')} onPress={() => void refetch()} />
      </View>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.background, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}>
        <Icon name="clock" size={theme.size.control.sm} color={theme.color.textSubtle} />
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>{t('bookings.empty')}</Text>
      </View>
    )
  }

  const active = activeBookings(bookings)
  const past = pastBookings(bookings)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{
        paddingTop: insets.top + theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: insets.bottom + theme.spacing.xxl * 2,
        gap: theme.spacing.md,
      }}
    >
      <Text style={{ color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight }}>
        {t('bookings.title')}
      </Text>

      {active.length === 0 ? (
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
          {t('bookings.noActive')}
        </Text>
      ) : (
        active.map((b) => (
          <BookingRow
            key={b.id}
            booking={b}
            cancelling={cancelling.isLoading}
            onCancel={() => onCancel(b.id)}
            onPickup={() => navigation.navigate('Pickup', { bookingId: b.id, vehicleId: b.vehicleId })}
            onReturn={() => navigation.navigate('Return', { bookingId: b.id })}
            onRate={() => navigation.navigate('Rating', { bookingId: b.id })}
            onReceipt={() => navigation.navigate('Receipt', { bookingId: b.id })}
            onRebook={() => navigation.navigate('Booking', { vehicleId: b.vehicleId })}
          />
        ))
      )}

      {past.length > 0 && (
        <>
          <Text
            style={{
              color: theme.color.textMuted,
              fontSize: theme.typography.subtitle.fontSize,
              fontWeight: '600',
              marginTop: theme.spacing.md,
            }}
          >
            {t('bookings.historyTitle')}
          </Text>
          {past.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              cancelling={cancelling.isLoading}
              onCancel={() => onCancel(b.id)}
              onPickup={() => navigation.navigate('Pickup', { bookingId: b.id, vehicleId: b.vehicleId })}
              onReturn={() => navigation.navigate('Return', { bookingId: b.id })}
              onRate={() => navigation.navigate('Rating', { bookingId: b.id })}
              onReceipt={() => navigation.navigate('Receipt', { bookingId: b.id })}
              onRebook={() => navigation.navigate('Booking', { vehicleId: b.vehicleId })}
            />
          ))}
        </>
      )}
    </ScrollView>
  )
}

function BookingRow({
  booking,
  cancelling,
  onCancel,
  onPickup,
  onReturn,
  onRate,
  onReceipt,
  onRebook,
}: {
  booking: BookingSummary
  cancelling: boolean
  onCancel: () => void
  onPickup: () => void
  onReturn: () => void
  onRate: () => void
  onReceipt: () => void
  onRebook: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const isPast = booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected'
  return (
    <View
      style={{
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm }}>
        <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '600', flex: 1 }}>
          {booking.vehicleName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          {booking.paymentStatus && (
            <View
              style={{
                backgroundColor: theme.color.surfaceAlt,
                borderRadius: theme.radius.pill,
                paddingVertical: theme.spacing.xs,
                paddingHorizontal: theme.spacing.sm,
              }}
            >
              <Text
                style={{
                  color: paymentStatusColor(theme, booking.paymentStatus),
                  fontSize: theme.typography.caption.fontSize,
                  fontWeight: '600',
                }}
              >
                {t(`bookings.paymentStatus.${booking.paymentStatus}`)}
              </Text>
            </View>
          )}
          <Text style={{ color: statusColor(theme, booking.status), fontSize: theme.typography.caption.fontSize, fontWeight: '600' }}>
            {t(`bookings.status.${booking.status}`)}
          </Text>
        </View>
      </View>
      <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
        {t('bookings.dateRange', { start: day(booking.startAt), end: day(booking.endAt) })}
      </Text>
      <Text style={{ color: theme.color.text, fontWeight: '600' }}>
        {booking.total} {booking.currency}
      </Text>
      {booking.status === 'vehicle-prepared' && (
        <Button title={t('bookings.pickup')} onPress={onPickup} />
      )}
      {booking.status === 'picked-up' && (
        <Button title={t('bookings.returnVehicle')} onPress={onReturn} />
      )}
      {booking.status === 'completed' && (
        <Button title={t('bookings.rate')} onPress={onRate} />
      )}
      {isPast && (
        <>
          <Button title={t('bookings.viewReceipt')} onPress={onReceipt} />
          <Button title={t('bookings.rebook')} onPress={onRebook} />
        </>
      )}
      {canCancel(booking.status) && (
        <Button
          title={cancelling ? t('bookings.cancelling') : t('bookings.cancel')}
          onPress={onCancel}
          disabled={cancelling}
        />
      )}
    </View>
  )
}
