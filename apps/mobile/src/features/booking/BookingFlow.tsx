import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import type { Quote, RentalPlan } from '@car-rental/types'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import {
  useCreateBookingMutation,
  useGetBranchOptionsQuery,
  useGetVehiclesQuery,
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

export function BookingFlow({ onClose }: { onClose: () => void }) {
  const theme = useTheme()
  const [step, setStep] = useState<Step>('vehicle')
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)

  const vehicles = useGetVehiclesQuery()
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
      setError('Could not price this booking. Check your dates and try again.')
    }
  }

  const onConfirm = async () => {
    try {
      await createBooking(toCreateRequest(draft)).unwrap()
      setStep('done')
    } catch {
      setError('Could not create the booking. Please try again.')
    }
  }

  const heading = { fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <Text style={{ color: theme.color.primary, ...heading }}>Book a car</Text>
        <Pressable onPress={onClose}>
          <Text style={{ color: theme.color.textMuted }}>Cancel</Text>
        </Pressable>
      </View>

      {error ? <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.md }}>{error}</Text> : null}

      {step === 'vehicle' && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>Choose a vehicle</Text>
          {vehicles.isLoading && <ActivityIndicator color={theme.color.primary} />}
          {vehicles.isError && <Text style={{ color: theme.color.danger }}>Could not load vehicles.</Text>}
          {vehicles.data?.map((v) => (
            <SelectRow
              key={v.id}
              label={v.name}
              sublabel={`${v.category} · ${v.pricePerDay} ${v.currency}/day`}
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
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>Plan</Text>
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
                  <Text style={{ color: selected ? theme.color.onPrimary : theme.color.text }}>{p}</Text>
                </Pressable>
              )
            })}
          </View>

          <TextField
            label="Start date (YYYY-MM-DD)"
            value={draft.startDate}
            onChangeText={(t) => update({ startDate: t })}
            placeholder="2026-07-01"
            autoCapitalize="none"
          />
          <TextField
            label="End date (YYYY-MM-DD)"
            value={draft.endDate}
            onChangeText={(t) => update({ endDate: t })}
            placeholder="2026-07-04"
            autoCapitalize="none"
          />

          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>Pickup branch</Text>
          {branches.isLoading && <ActivityIndicator color={theme.color.primary} />}
          {branches.data?.map((b) => (
            <SelectRow
              key={`pickup-${b.id}`}
              label={b.name}
              selected={draft.pickupBranchId === b.id}
              onPress={() => update({ pickupBranchId: b.id })}
            />
          ))}

          <Text style={{ color: theme.color.text, marginVertical: theme.spacing.sm }}>Drop-off branch</Text>
          {branches.data?.map((b) => (
            <SelectRow
              key={`dropoff-${b.id}`}
              label={b.name}
              selected={draft.dropoffBranchId === b.id}
              onPress={() => update({ dropoffBranchId: b.id })}
            />
          ))}

          <TextField
            label="Discount code (optional)"
            value={draft.discountCode}
            onChangeText={(t) => update({ discountCode: t })}
            placeholder="WELCOME10"
            autoCapitalize="characters"
          />

          <View style={{ marginTop: theme.spacing.md }}>
            <Button title={quoting.isLoading ? 'Pricing…' : 'Get quote'} onPress={onGetQuote} disabled={quoting.isLoading} />
          </View>
        </View>
      )}

      {step === 'review' && quote && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.md }}>Review your booking</Text>
          <QuoteRow label={`${quote.days} day(s) × ${quote.pricePerDay} (${quote.plan})`} value={`${quote.subtotal} ${quote.currency}`} />
          {quote.discountAmount > 0 && (
            <QuoteRow label={`Discount ${quote.discountCode ?? ''}`} value={`-${quote.discountAmount} ${quote.currency}`} />
          )}
          <QuoteRow label={`Tax (${quote.taxRatePct}%)`} value={`${quote.tax} ${quote.currency}`} />
          <QuoteRow label="Total" value={`${quote.total} ${quote.currency}`} strong />
          <View style={{ marginTop: theme.spacing.lg }}>
            <Button title={creating.isLoading ? 'Booking…' : 'Confirm booking'} onPress={onConfirm} disabled={creating.isLoading} />
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            <Pressable onPress={() => setStep('customize')}>
              <Text style={{ color: theme.color.textMuted, textAlign: 'center' }}>Back</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'done' && (
        <View>
          <Text style={{ color: theme.color.success, ...heading, marginBottom: theme.spacing.sm }}>Booking reserved!</Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.lg }}>
            The provider will review and confirm it shortly.
          </Text>
          <Button title="Done" onPress={onClose} />
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
