import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme, type Theme } from '@car-rental/tokens'
import type { BookingSummary, PaymentStatus } from '@car-rental/types'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useGetBookingsQuery } from '../../store/bookingApi'
import { receiptLines } from './history'

const paymentStatusColor = (theme: Theme, status: PaymentStatus): string => {
  if (status === 'paid') return theme.color.success
  if (status === 'failed') return theme.color.danger
  if (status === 'pending') return theme.color.warning
  return theme.color.textMuted // refunded
}

const day = (iso: string) => iso.slice(0, 10)

/**
 * Itemized receipt for a past rental. Built entirely from the booking summary
 * the list already holds (no new endpoint) — we just select the row by id.
 */
export function ReceiptScreen({
  bookingId,
  onClose,
}: {
  bookingId: string
  onClose: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const { booking, isLoading } = useGetBookingsQuery(undefined, {
    selectFromResult: ({ data, isLoading }) => ({
      booking: data?.find((b) => b.id === bookingId),
      isLoading,
    }),
  })

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
    >
      <ScreenHeader title={t('receipt.title')} onBack={onClose} />

      {isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : !booking ? (
        <Text style={{ color: theme.color.danger }}>{t('receipt.notFound')}</Text>
      ) : (
        <ReceiptBody booking={booking} />
      )}
    </ScrollView>
  )
}

function ReceiptBody({ booking }: { booking: BookingSummary }) {
  const theme = useTheme()
  const { t } = useTranslation()
  const lines = receiptLines(booking)
  const amount = (value: number) => `${value} ${booking.currency}`

  return (
    <View
      style={{
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
      }}
    >
      <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '600' }}>
        {booking.vehicleName}
      </Text>
      <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
        {t('bookings.dateRange', { start: day(booking.startAt), end: day(booking.endAt) })}
      </Text>

      {booking.paymentStatus ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
          <Text style={{ color: theme.color.textMuted }}>{t('receipt.payment')}</Text>
          <Text style={{ color: paymentStatusColor(theme, booking.paymentStatus), fontWeight: '600' }}>
            {t(`bookings.paymentStatus.${booking.paymentStatus}`)}
          </Text>
        </View>
      ) : null}

      <View style={{ height: 1, backgroundColor: theme.color.border, marginVertical: theme.spacing.sm }} />

      {lines.map((line) => {
        const isTotal = line.key === 'total'
        return (
          <View key={line.key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text
              style={{
                color: isTotal ? theme.color.text : theme.color.textMuted,
                fontWeight: isTotal ? '600' : '400',
              }}
            >
              {t(`receipt.lines.${line.key}`)}
            </Text>
            <Text
              style={{
                color: isTotal ? theme.color.text : theme.color.textMuted,
                fontWeight: isTotal ? '600' : '400',
              }}
            >
              {amount(line.amount)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
