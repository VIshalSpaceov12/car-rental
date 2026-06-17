import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'
import { useReducedMotion } from './useReducedMotion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Hero control dimensions and the shackle's open-state rotation/lift.
const SHACKLE_ROTATE = '-22deg'
const SHACKLE_LIFT = -4

type Phase = 'locked' | 'unlocking' | 'unlocked'

/**
 * Signature OTP lock→unlock hero. Pressing it animates the padlock open (rotate +
 * lift, `duration.hero`), expands a ripple, swaps to a success check, then fires
 * `onUnlocked` (the caller shows a success Toast + advances the flow). Idempotent:
 * once unlocking starts, further presses are ignored.
 */
export function UnlockButton({
  onUnlocked,
  disabled,
  accessibilityLabel,
}: {
  onUnlocked: () => void
  disabled?: boolean
  accessibilityLabel: string
}) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('locked')

  const scale = useSharedValue(1)
  const shackle = useSharedValue(0) // 0 = closed, 1 = open
  const ripple = useSharedValue(0) // 0..1 ripple progress

  const SIZE = theme.size.control.lg

  const press = () => {
    if (disabled || phase !== 'locked') return
    setPhase('unlocking')

    if (reduced) {
      setPhase('unlocked')
      onUnlocked()
      return
    }

    scale.value = withSequence(
      withTiming(0.94, { duration: theme.motion.duration.fast }),
      withTiming(1, theme.motion.spring.press ? { duration: theme.motion.duration.base } : {}),
    )
    ripple.value = withTiming(1, { duration: theme.motion.duration.hero, easing: Easing.out(Easing.ease) })
    shackle.value = withTiming(
      1,
      { duration: theme.motion.duration.hero, easing: Easing.bezier(...theme.motion.easing.standard) },
      (finished) => {
        if (finished) {
          runOnJS(setPhase)('unlocked')
          runOnJS(onUnlocked)()
        }
      },
    )
  }

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const shackleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: shackle.value * SHACKLE_LIFT },
      { rotateZ: `${shackle.value * parseFloat(SHACKLE_ROTATE)}deg` },
    ],
  }))
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.5,
    transform: [{ scale: 1 + ripple.value * 1.4 }],
  }))

  return (
    <AnimatedPressable
      onPress={press}
      disabled={disabled || phase !== 'locked'}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || phase !== 'locked' }}
      style={[
        containerStyle,
        {
          alignSelf: 'center',
          shadowColor: theme.color.glow,
          shadowOpacity: 1,
          shadowRadius: theme.elevation.lg.shadowRadius,
          shadowOffset: theme.elevation.lg.shadowOffset,
          elevation: theme.elevation.lg.elevation,
        },
      ]}
    >
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        {/* Expanding success ring behind the lock (bordered, not a filled disc). */}
        <Animated.View
          pointerEvents="none"
          style={[
            rippleStyle,
            {
              position: 'absolute',
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              borderWidth: 2,
              borderColor: theme.color.success,
              backgroundColor: 'transparent',
            },
          ]}
        />
        <LinearGradient
          colors={theme.color.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' }}
        >
          {phase === 'unlocked' ? (
            <Icon name="check" size={theme.size.icon.xxl} color={theme.color.success} />
          ) : (
            // The padlock body stays; the shackle (same glyph) tilts/lifts to read as "opening".
            <Animated.View style={shackleStyle}>
              <Icon name={phase === 'locked' ? 'lock' : 'unlock'} size={theme.size.icon.xxl} color={theme.color.onPrimary} />
            </Animated.View>
          )}
        </LinearGradient>
      </View>
    </AnimatedPressable>
  )
}
