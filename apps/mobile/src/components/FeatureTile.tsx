import { Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

/** Spec tile for the details grid: icon + title + subtitle on a raised surface. */
export function FeatureTile({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  const theme = useTheme()
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.color.surfaceAlt,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      <Icon name={icon} size={theme.size.icon.xl} color={theme.color.text} />
      <View>
        <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '600' }}>
          {title}
        </Text>
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{subtitle}</Text>
      </View>
    </View>
  )
}
