import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'

/** Section title with an optional trailing "See all ›" action or filter icon. */
export function SectionHeader({
  title,
  onSeeAll,
  onFilter,
}: {
  title: string
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
      <Text
        style={{
          color: theme.color.text,
          fontSize: theme.typography.title.fontSize,
          fontWeight: theme.typography.title.fontWeight,
        }}
      >
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} accessibilityRole="button" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{t('common.seeAll')}</Text>
          <Icon name="chevron" size={theme.size.icon.xs} color={theme.color.textMuted} />
        </Pressable>
      )}
      {onFilter && (
        <Pressable
          onPress={onFilter}
          accessibilityRole="button"
          accessibilityLabel={t('common.filters')}
          hitSlop={8}
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
