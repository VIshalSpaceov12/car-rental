import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'

/**
 * Section title with an optional trailing action. Either provide an `onAction`
 * with a custom `actionLabel` (e.g. "View All", accent-colored, no chevron — the
 * minimal design), or the legacy `onSeeAll` / `onFilter` affordances.
 */
export function SectionHeader({
  title,
  onAction,
  actionLabel,
  onSeeAll,
  onFilter,
}: {
  title: string
  onAction?: () => void
  actionLabel?: string
  onSeeAll?: () => void
  onFilter?: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
      }}
    >
      <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}>
        {title}
      </Text>

      {onAction && actionLabel && (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={theme.spacing.sm}>
          <Text style={{ color: theme.color.accent, fontSize: theme.typography.caption.fontSize, fontWeight: '600' }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}

      {onSeeAll && (
        <Pressable onPress={onSeeAll} accessibilityRole="button" hitSlop={theme.spacing.sm} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{t('common.seeAll')}</Text>
          <Icon name="chevron" size={theme.size.icon.xs} color={theme.color.textMuted} />
        </Pressable>
      )}

      {onFilter && (
        <Pressable
          onPress={onFilter}
          accessibilityRole="button"
          accessibilityLabel={t('common.filters')}
          hitSlop={theme.spacing.sm}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}
        >
          <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
            {t('common.filters')}
          </Text>
          <Icon name="filter" size={theme.size.icon.sm} color={theme.color.textMuted} />
        </Pressable>
      )}
    </View>
  )
}
