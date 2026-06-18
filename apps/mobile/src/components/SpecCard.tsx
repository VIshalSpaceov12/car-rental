import { Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Card } from './Card'
import { Icon, type IconName } from './Icon'

/**
 * Detail-screen 2×2 spec grid item: an inset surfaceAlt card with a leading icon,
 * a muted label, and a bold value (e.g. icon · "Engine" · "V8 Twin-Turbo").
 */
export function SpecCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme()
  return (
    <Card tone="surfaceAlt" elevated={false} style={{ flex: 1, gap: theme.spacing.sm }}>
      <Icon name={icon} size={theme.size.icon.xl} color={theme.color.text} />
      <View>
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{label}</Text>
        <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '700' }}>
          {value}
        </Text>
      </View>
    </Card>
  )
}
