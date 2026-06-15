import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { Rating } from '@car-rental/types'

/**
 * Read-only post-rental rating shown on a completed booking. Fully prop-driven
 * (the container passes the loaded rating, or `null` when the customer hasn't
 * rated yet / the API 404s) so it renders without the store and is unit-testable.
 */
export interface RatingDisplayProps {
  /** The customer's rating, or null when not rated yet (no rating / 404). */
  rating: Rating | null
}

export function RatingDisplay({ rating }: RatingDisplayProps) {
  const theme = useTheme()
  const { t } = useTranslation()

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.xs,
    marginBlockStart: theme.spacing.sm,
    paddingBlockStart: theme.spacing.sm,
    borderBlockStart: `1px solid ${theme.color.border}`,
    width: '100%',
  }

  if (!rating) {
    return (
      <div style={sectionStyle}>
        <div style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
          {t('bookings.rating.notRated')}
        </div>
      </div>
    )
  }

  return (
    <div style={sectionStyle}>
      <div style={{ color: theme.color.text, fontWeight: theme.typography.label.fontWeight }}>
        {t('bookings.rating.title')}
      </div>
      <div style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
        {t('bookings.rating.vehicle', { score: rating.vehicleRating })}
      </div>
      <div style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
        {t('bookings.rating.service', { score: rating.serviceRating })}
      </div>
      {rating.comment && (
        <div style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
          {t('bookings.rating.comment', { comment: rating.comment })}
        </div>
      )}
    </div>
  )
}
