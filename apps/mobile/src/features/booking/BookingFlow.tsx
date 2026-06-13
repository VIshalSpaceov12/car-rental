import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { Quote, RentalPlan } from '@car-rental/types'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { useVehiclesQuery } from '../../store/fleetApi'
import {
  useCreateBookingMutation,
  useGetBranchOptionsQuery,
  useQuoteMutation,
} from '../../store/bookingApi'
import { emptyDraft, toCreateRequest, toQuoteRequest, validateDraft, type BookingDraft } from './bookingDraft'

const PLANS: RentalPlan[] = ['daily', 'weekly', 'monthly', 'long-term']

type Step = 'vehicle' | 'customize' | 'review' | 'done'

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
  // With a vehicle preselected from Details, skip the generic picker.
  const [step, setStep] = useState<Step>(initialVehicleId ? 'customize' : 'vehicle')
  const [draft, setDraft] = useState<BookingDraft>(() =>
    initialVehicleId ? { ...emptyDraft, vehicleId: initialVehicleId } : emptyDraft,
  )
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)

  const vehicles = useVehiclesQuery({ available: true })
  const branches = useGetBranchOptionsQuery(draft.vehicleId ?? '', { skip: !draft.vehicleId })
  const [requestQuote, quoting] = useQuoteMutation()
  const [createBooking, creating] = useCreateBookingMutation()

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
    }
  }

  const onConfirm = async () => {
    try {
      await createBooking(toCreateRequest(draft)).unwrap()
      setStep('done')
    } catch {
      setError(t('booking.createError'))
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
          {vehicles.isLoading && <ActivityIndicator color={theme.color.primary} />}
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

          <TextField
            label={t('booking.startDateLabel')}
            value={draft.startDate}
            onChangeText={(text) => update({ startDate: text })}
            placeholder="2026-07-01"
            autoCapitalize="none"
          />
          <TextField
            label={t('booking.endDateLabel')}
            value={draft.endDate}
            onChangeText={(text) => update({ endDate: text })}
            placeholder="2026-07-04"
            autoCapitalize="none"
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

      {step === 'done' && (
        <View>
          <Text style={{ color: theme.color.success, ...heading, marginBottom: theme.spacing.sm }}>
            {t('booking.reservedTitle')}
          </Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.lg }}>
            {t('booking.reservedBody')}
          </Text>
          <Button title={t('common.done')} onPress={onClose} />
        </View>
      )}
    </ScrollView>
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
