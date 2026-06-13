import { Pressable, Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

// Decorative trailing `›››` chevrons; sized just under the small icon token.
const CHEVRON_SIZE = 15
// Subtle dim on press for the whole pill.
const PRESSED_OPACITY = 0.92

/**
 * Primary call-to-action pill: leading red circle (icon) + centered label +
 * trailing `›››`. One tap target (the leading circle is decorative). Used for
 * "Get Started" and "Book now".
 */
export function CtaBar({
  label,
  icon = 'car',
  onPress,
}: {
  label: string
  icon?: IconName
  onPress: () => void
}) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.pill,
        padding: theme.spacing.xs,
        opacity: pressed ? PRESSED_OPACITY : 1,
      })}
    >
      <View
        style={{
          width: theme.size.control.md,
          height: theme.size.control.md,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.color.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={theme.size.icon.xxl} color={theme.color.onPrimary} />
      </View>
      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          color: theme.color.text,
          fontSize: theme.typography.subtitle.fontSize,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', paddingEnd: theme.spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Icon key={i} name="chevron" size={CHEVRON_SIZE} color={theme.color.textSubtle} />
        ))}
      </View>
    </Pressable>
  )
}
