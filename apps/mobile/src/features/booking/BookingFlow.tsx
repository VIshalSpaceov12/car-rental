import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { PaymentMethod, Quote, RentalPlan } from '@car-rental/types'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { DateField } from '../../components/DateField'
import { todayYmd } from '../../components/dateGrid'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/Toast'
import { useVehiclesQuery } from '../../store/fleetApi'
import {
  useCreateBookingMutation,
  useGetBranchOptionsQuery,
  usePayMutation,
  useQuoteMutation,
} from '../../store/bookingApi'
import { emptyDraft, toCreateRequest, toQuoteRequest, validateDraft, type BookingDraft } from './bookingDraft'

const PLANS: RentalPlan[] = ['daily', 'weekly', 'monthly', 'long-term']
const PAYMENT_METHODS: PaymentMethod[] = ['card-mock', 'cash-on-delivery']

type Step = 'vehicle' | 'customize' | 'review' | 'checkout' | 'done'

function SelectRow({
  label,
  sublabel,
  selected,
  onPress,
}: {
  label: string
  sublabel?: string
  selected: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: selected ? theme.color.primary : theme.color.surface,
        backgroundColor: selected ? theme.color.surface : theme.color.background,
        marginBottom: theme.spacing.sm,
      }}
    >
      <Text style={{ color: theme.color.text, fontWeight: selected ? '600' : '400' }}>{label}</Text>
      {sublabel ? <Text style={{ color: theme.color.textMuted }}>{sublabel}</Text> : null}
    </Pressable>
  )
}

export function BookingFlow({
  initialVehicleId,
  onClose,
}: {
  initialVehicleId?: string
  onClose: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const toast = useToast()
  // With a vehicle preselected from Details, skip the generic picker.
  const [step, setStep] = useState<Step>(initialVehicleId ? 'customize' : 'vehicle')
  const [draft, setDraft] = useState<BookingDraft>(() =>
    initialVehicleId ? { ...emptyDraft, vehicleId: initialVehicleId } : emptyDraft,
  )
  const [quote, setQuote] = useState<Quote | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('card-mock')
  // The method that actually confirmed the booking, for the success copy.
  const [paidMethod, setPaidMethod] = useState<PaymentMethod | null>(null)
  const [error, setError] = useState<string | null>(null)

  const vehicles = useVehiclesQuery({ available: true })
  const branches = useGetBranchOptionsQuery(draft.vehicleId ?? '', { skip: !draft.vehicleId })
  const [requestQuote, quoting] = useQuoteMutation()
  const [createBooking, creating] = useCreateBookingMutation()
  const [pay, paying] = usePayMutation()

  const update = (patch: Partial<BookingDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const onGetQuote = async () => {
    const err = validateDraft(draft)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    try {
      const q = await requestQuote(toQuoteRequest(draft)).unwrap()
      setQuote(q)
      setStep('review')
    } catch {
      setError(t('booking.priceError'))
      toast.show({ message: t('booking.priceError'), variant: 'error' })
    }
  }

  // Review-confirm creates the booking (status `reserved`) and moves to payment.
  const onConfirm = async () => {
    setError(null)
    try {
      const booking = await createBooking(toCreateRequest(draft)).unwrap()
      setBookingId(booking.id)
      setStep('checkout')
    } catch {
      setError(t('booking.createError'))
      toast.show({ message: t('booking.createError'), variant: 'error' })
    }
  }

  // Pay confirms the reserved booking. A `failed` payment (or a request error)
  // leaves the booking `reserved`; we stay on checkout so the customer can retry
  // or switch to cash-on-delivery.
  const onPay = async () => {
    if (!bookingId) return
    setError(null)
    try {
      const payment = await pay({ bookingId, body: { method } }).unwrap()
      if (payment.status === 'failed') {
        setError(t('booking.paymentFailed'))
        toast.show({ message: t('booking.paymentFailed'), variant: 'error' })
        return
      }
      setPaidMethod(method)
      toast.show({ message: t('booking.confirmedTitle'), variant: 'success' })
      setStep('done')
    } catch {
      setError(t('booking.paymentError'))
      toast.show({ message: t('booking.paymentError'), variant: 'error' })
    }
  }

  const heading = { fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <Text style={{ color: theme.color.primary, ...heading }}>{t('booking.title')}</Text>
        <Pressable onPress={onClose}>
          <Text style={{ color: theme.color.textMuted }}>{t('common.cancel')}</Text>
        </Pressable>
      </View>

      {error ? <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.md }}>{error}</Text> : null}

      {step === 'vehicle' && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>{t('booking.chooseVehicle')}</Text>
          {vehicles.isLoading && (
            <View style={{ gap: theme.spacing.sm }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={56} radius={theme.radius.md} />
              ))}
            </View>
          )}
          {vehicles.isError && <Text style={{ color: theme.color.danger }}>{t('booking.loadVehiclesError')}</Text>}
          {vehicles.data?.map((v) => (
            <SelectRow
              key={v.id}
              label={v.name}
              sublabel={t('booking.vehicleSubtitle', { category: v.category, price: v.pricePerDay, currency: v.currency })}
              selected={draft.vehicleId === v.id}
              onPress={() => {
                update({ vehicleId: v.id, pickupBranchId: null, dropoffBranchId: null })
                setError(null)
                setStep('customize')
              }}
            />
          ))}
        </View>
      )}

      {step === 'customize' && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>{t('booking.plan')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            {PLANS.map((p) => {
              const selected = draft.plan === p
              return (
                <Pressable
                  key={p}
                  onPress={() => update({ plan: p })}
                  style={{
                    paddingVertical: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    backgroundColor: selected ? theme.color.primary : theme.color.surface,
                  }}
                >
                  <Text style={{ color: selected ? theme.color.onPrimary : theme.color.text }}>
                    {t(`booking.plans.${p}`)}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <DateField
            label={t('booking.startDateLabel')}
            value={draft.startDate}
            onChange={(date) => update({ startDate: date })}
            minDate={todayYmd()}
            placeholder={t('booking.datePlaceholder')}
          />
          <DateField
            label={t('booking.endDateLabel')}
            value={draft.endDate}
            onChange={(date) => update({ endDate: date })}
            minDate={draft.startDate || todayYmd()}
            placeholder={t('booking.datePlaceholder')}
          />

          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>{t('booking.pickupBranch')}</Text>
          {branches.isLoading && <ActivityIndicator color={theme.color.primary} />}
          {branches.data?.map((b) => (
            <SelectRow
              key={`pickup-${b.id}`}
              label={b.name}
              selected={draft.pickupBranchId === b.id}
              onPress={() => update({ pickupBranchId: b.id })}
            />
          ))}

          <Text style={{ color: theme.color.text, marginVertical: theme.spacing.sm }}>{t('booking.dropoffBranch')}</Text>
          {branches.data?.map((b) => (
            <SelectRow
              key={`dropoff-${b.id}`}
              label={b.name}
              selected={draft.dropoffBranchId === b.id}
              onPress={() => update({ dropoffBranchId: b.id })}
            />
          ))}

          <TextField
            label={t('booking.discountCodeLabel')}
            value={draft.discountCode}
            onChangeText={(text) => update({ discountCode: text })}
            placeholder="WELCOME10"
            autoCapitalize="characters"
          />

          <View style={{ marginTop: theme.spacing.md }}>
            <Button
              title={quoting.isLoading ? t('booking.pricing') : t('booking.getQuote')}
              onPress={onGetQuote}
              disabled={quoting.isLoading}
            />
          </View>
        </View>
      )}

      {step === 'review' && quote && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.md }}>{t('booking.reviewTitle')}</Text>
          <QuoteSummary quote={quote} />
          <View style={{ marginTop: theme.spacing.lg }}>
            <Button
              title={creating.isLoading ? t('booking.booking') : t('booking.confirm')}
              onPress={onConfirm}
              disabled={creating.isLoading}
            />
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            <Pressable onPress={() => setStep('customize')}>
              <Text style={{ color: theme.color.textMuted, textAlign: 'center' }}>{t('common.back')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'checkout' && quote && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.md }}>{t('booking.checkoutTitle')}</Text>
          <QuoteSummary quote={quote} />

          <Text style={{ color: theme.color.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            {t('booking.paymentMethod')}
          </Text>
          {PAYMENT_METHODS.map((m) => (
            <SelectRow
              key={m}
              label={t(`booking.methods.${m}`)}
              selected={method === m}
              onPress={() => {
                setMethod(m)
                setError(null)
              }}
            />
          ))}

          <View style={{ marginTop: theme.spacing.lg }}>
            <Button
              title={paying.isLoading ? t('booking.paying') : t('booking.pay')}
              onPress={onPay}
              disabled={paying.isLoading}
            />
          </View>
        </View>
      )}

      {step === 'done' && (
        <View>
          <Text style={{ color: theme.color.success, ...heading, marginBottom: theme.spacing.sm }}>
            {t('booking.confirmedTitle')}
          </Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.lg }}>
            {paidMethod === 'cash-on-delivery' ? t('booking.confirmedCodBody') : t('booking.confirmedPaidBody')}
          </Text>
          <Button title={t('common.done')} onPress={onClose} />
        </View>
      )}
    </ScrollView>
  )
}

/** Itemized quote breakdown shared by the review and checkout steps. */
function QuoteSummary({ quote }: { quote: Quote }) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <View>
      <QuoteRow
        label={t('booking.lineItem', { days: quote.days, pricePerDay: quote.pricePerDay, plan: t(`booking.plans.${quote.plan}`) })}
        value={`${quote.subtotal} ${quote.currency}`}
      />
      {quote.minRentalDaysApplied && (
        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.sm }}>
          {t('booking.minRentalNotice', { days: quote.days })}
        </Text>
      )}
      {quote.discountAmount > 0 && (
        <QuoteRow
          label={t('booking.discountLine', { code: quote.discountCode ?? '' })}
          value={`-${quote.discountAmount} ${quote.currency}`}
        />
      )}
      <QuoteRow label={t('booking.taxLine', { rate: quote.taxRatePct })} value={`${quote.tax} ${quote.currency}`} />
      <QuoteRow label={t('booking.total')} value={`${quote.total} ${quote.currency}`} strong />
    </View>
  )
}

function QuoteRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const theme = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
      <Text style={{ color: theme.color.text, fontWeight: strong ? '700' : '400' }}>{label}</Text>
      <Text style={{ color: theme.color.text, fontWeight: strong ? '700' : '400' }}>{value}</Text>
    </View>
  )
}
