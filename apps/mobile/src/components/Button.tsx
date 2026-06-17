import { Pressable, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@car-rental/tokens'
import { useReducedMotion } from './useReducedMotion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Variant = 'primary' | 'surface'

/**
 * Primary action. The `primary` variant fills the brand gradient + glow and
 * springs down on press; `surface` is a flat fallback. Disabled drops to a muted
 * fill. API (title/onPress/disabled) is unchanged so existing callers keep working.
 */
export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: Variant
}) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const pressIn = () => {
    if (!reduced) scale.value = withSpring(0.97, theme.motion.spring.press)
  }
  const pressOut = () => {
    if (!reduced) scale.value = withSpring(1, theme.motion.spring.press)
  }

  const radius = theme.radius.md
  const content = (
    <Text style={{ color: theme.color.onPrimary, fontSize: theme.typography.body.fontSize, fontWeight: '600' }}>
      {title}
    </Text>
  )

  const inner = {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: radius,
  }

  // Gradient + glow are reserved for the enabled primary variant; disabled and
  // surface use a flat fill so they read as secondary.
  const useGradient = variant === 'primary' && !disabled

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        animatedStyle,
        { borderRadius: radius },
        useGradient
          ? {
              shadowColor: theme.color.glow,
              shadowOpacity: 1,
              shadowRadius: theme.elevation.lg.shadowRadius,
              shadowOffset: theme.elevation.lg.shadowOffset,
              elevation: theme.elevation.lg.elevation,
            }
          : null,
      ]}
    >
      {useGradient ? (
        <LinearGradient
          colors={theme.color.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={inner}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={{
            ...inner,
            backgroundColor: disabled ? theme.color.textMuted : theme.color.surface,
          }}
        >
          {content}
        </View>
      )}
    </AnimatedPressable>
  )
}
