import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { Rating } from '@car-rental/types'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useGetRatingQuery, useRateBookingMutation } from '../../store/bookingApi'

const SCORES = [1, 2, 3, 4, 5] as const

/** A 1–5 score picker rendered as a row of selectable pills. */
function ScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (score: number) => void
}) {
  const theme = useTheme()
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {SCORES.map((score) => {
          const selected = score === value
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              accessibilityRole="button"
              accessibilityLabel={String(score)}
              style={{
                flex: 1,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: selected ? theme.color.primary : theme.color.border,
                backgroundColor: selected ? theme.color.surface : theme.color.background,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: selected ? theme.color.primary : theme.color.textMuted,
                  fontWeight: selected ? '600' : '400',
                }}
              >
                {score}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

/** Read-only summary shown once a rating exists (after submit or on revisit). */
function SubmittedRating({ rating }: { rating: Rating }) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text style={{ color: theme.color.success, fontSize: theme.typography.subtitle.fontSize, fontWeight: '600' }}>
        {t('rating.alreadyRated')}
      </Text>
      <Text style={{ color: theme.color.text }}>
        {t('rating.vehicleScore', { score: rating.vehicleRating })}
      </Text>
      <Text style={{ color: theme.color.text }}>
        {t('rating.serviceScore', { score: rating.serviceRating })}
      </Text>
      {rating.comment ? (
        <Text style={{ color: theme.color.textMuted }}>{rating.comment}</Text>
      ) : null}
    </View>
  )
}

/**
 * Post-rental rating for a `completed` booking. Shows the existing rating if one
 * is already on file; otherwise collects two 1–5 scores + an optional comment.
 */
export function RatingScreen({
  bookingId,
  onClose,
}: {
  bookingId: string
  onClose: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()

  // 404 means "not rated yet" — RTK Query surfaces it as an error we treat as empty.
  const { data: existing, isLoading: loadingExisting } = useGetRatingQuery(bookingId)
  const [rateBooking, rating] = useRateBookingMutation()

  const [vehicleRating, setVehicleRating] = useState(5)
  const [serviceRating, setServiceRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState<Rating | null>(null)
  const [error, setError] = useState<string | null>(null)

  const result = submitted ?? existing ?? null

  const onSubmit = async () => {
    setError(null)
    const trimmed = comment.trim()
    try {
      const saved = await rateBooking({
        bookingId,
        body: { vehicleRating, serviceRating, ...(trimmed ? { comment: trimmed } : {}) },
      }).unwrap()
      setSubmitted(saved)
    } catch {
      setError(t('rating.error'))
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
    >
      <ScreenHeader title={t('rating.title')} onBack={onClose} />

      {loadingExisting ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : result ? (
        <SubmittedRating rating={result} />
      ) : (
        <View>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.lg }}>{t('rating.intro')}</Text>
          {error ? <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.md }}>{error}</Text> : null}
          <ScoreSelector label={t('rating.vehicleLabel')} value={vehicleRating} onChange={setVehicleRating} />
          <ScoreSelector label={t('rating.serviceLabel')} value={serviceRating} onChange={setServiceRating} />
          <TextField
            label={t('rating.commentLabel')}
            value={comment}
            onChangeText={setComment}
            placeholder={t('rating.commentPlaceholder')}
            multiline
          />
          <Button
            title={rating.isLoading ? t('rating.submitting') : t('rating.submit')}
            onPress={onSubmit}
            disabled={rating.isLoading}
          />
        </View>
      )}
    </ScrollView>
  )
}
