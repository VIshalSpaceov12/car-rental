import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'

/**
 * Gold star + rating in a translucent bordered pill, with an optional trip count
 * ("4.5 (54 trips)"). Matches the Midnight GT rating-badge anatomy.
 */
export function RatingBadge({ value, trips }: { value: number; trips?: number }) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.color.border,
      }}
    >
      <Icon name="star" size={theme.size.icon.xs} color={theme.color.warning} />
      <Text style={{ color: theme.color.text, fontSize: theme.typography.caption.fontSize, fontWeight: '700' }}>
        {value.toFixed(1)}
      </Text>
      {trips != null && (
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
          {t('common.trips', { count: trips })}
        </Text>
      )}
    </View>
  )
}
