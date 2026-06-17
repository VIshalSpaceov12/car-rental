import { Pressable, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
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
      <LinearGradient
        colors={theme.color.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: theme.size.control.md,
          height: theme.size.control.md,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.color.glow,
          shadowOpacity: 1,
          shadowRadius: theme.elevation.md.shadowRadius,
          shadowOffset: theme.elevation.md.shadowOffset,
          elevation: theme.elevation.md.elevation,
        }}
      >
        <Icon name={icon} size={theme.size.icon.xxl} color={theme.color.onPrimary} />
      </LinearGradient>
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
