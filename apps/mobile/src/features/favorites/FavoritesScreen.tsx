import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Icon } from '../../components/Icon'

/**
 * Favorites tab — minimal placeholder. Saved-car persistence isn't wired yet
 * (the bookmark control is presentational), so this shows an empty state until a
 * favorites store exists. Kept intentionally light per the "do your best" scope.
 */
export function FavoritesScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background, paddingTop: insets.top + theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}>
      <Text style={{ color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: '700', marginBottom: theme.spacing.xxl }}>
        {t('favorites.title')}
      </Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}>
        <Icon name="bookmarkOutline" size={theme.size.icon.hero} color={theme.color.textSubtle} />
        <Text style={{ color: theme.color.textMuted, textAlign: 'center' }}>{t('favorites.empty')}</Text>
      </View>
    </View>
  )
}
