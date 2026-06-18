import { Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

/**
 * Compact icon + value pair for a card's spec row (e.g. "⚡ 577 hp", "⚙ Automatic",
 * "🪑 2 Seats"). Muted tone; the curated {@link Icon} set supplies the glyph.
 */
export function SpecItem({ icon, value }: { icon: IconName; value: string }) {
  const theme = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
      <Icon name={icon} size={theme.size.icon.sm} color={theme.color.textMuted} />
      <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{value}</Text>
    </View>
  )
}
