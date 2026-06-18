import { I18nManager, Pressable, Text, View, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'
import { useReducedMotion } from './useReducedMotion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Variant = 'primary' | 'pill' | 'secondary' | 'ghost'

/**
 * App action button. Variants:
 *  - `primary`  — ink fill (gradientPrimary) + onPrimary text, rounded radius.lg,
 *                 full-width by default (the "Book Now" CTA). Press-springs to 0.97.
 *  - `pill`     — compact icon + label on the ink fill, radius.pill (the floating
 *                 "Filter" button). Not full-width by default.
 *  - `secondary`— surface fill + border, ink text.
 *  - `ghost`    — transparent, ink text, no border.
 * `icon` renders an inline-start glyph (mirrored in RTL is unnecessary — these are
 * symmetric/semantic). Disabled drops the fill to a muted tone.
 */
export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
  icon,
  fullWidth,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: Variant
  icon?: IconName
  fullWidth?: boolean
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

  // `primary` is a block CTA → full-width; `pill` hugs its content unless asked.
  const isFullWidth = fullWidth ?? variant === 'primary'
  const useInk = (variant === 'primary' || variant === 'pill') && !disabled
  const radius = variant === 'pill' ? theme.radius.pill : theme.radius.lg

  const fg = useInk ? theme.color.onPrimary : disabled ? theme.color.textSubtle : theme.color.text

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
      }}
    >
      {icon ? (
        <View style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}>
          <Icon name={icon} size={theme.size.icon.md} color={fg} />
        </View>
      ) : null}
      <Text style={{ color: fg, fontSize: theme.typography.body.fontSize, fontWeight: '600' }}>{title}</Text>
    </View>
  )

  const inner: ViewStyle = {
    paddingVertical: variant === 'pill' ? theme.spacing.sm : theme.spacing.md,
    paddingHorizontal: variant === 'pill' ? theme.spacing.lg : theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius,
  }

  const flatBg =
    variant === 'ghost'
      ? 'transparent'
      : disabled
        ? theme.color.surfaceAlt
        : theme.color.surface

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        animatedStyle,
        { borderRadius: radius, alignSelf: isFullWidth ? 'stretch' : 'flex-start' },
        useInk
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
      {useInk ? (
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
            backgroundColor: flatBg,
            borderWidth: variant === 'secondary' ? 1 : 0,
            borderColor: theme.color.border,
          }}
        >
          {content}
        </View>
      )}
    </AnimatedPressable>
  )
}
