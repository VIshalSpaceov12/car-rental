import { useEffect, type ReactNode } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '@car-rental/tokens'
import { useReducedMotion } from './useReducedMotion'

// Per-index stagger and initial drop distance for the entrance.
const STAGGER_MS = 60
const TRANSLATE_FROM = 16

/**
 * Fade + translateY entrance with a stagger keyed off list index. Wrap each row
 * of the Browse / Bookings lists. With reduce-motion on it renders instantly.
 */
export function AnimatedListItem({ index, children }: { index: number; children: ReactNode }) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const opacity = useSharedValue(reduced ? 1 : 0)
  const translateY = useSharedValue(reduced ? 0 : TRANSLATE_FROM)

  useEffect(() => {
    if (reduced) return
    const delay = index * STAGGER_MS
    // Overshoot curve so rows fade + rise with a slight bounce (mockup ease-spring).
    const config = { duration: theme.motion.duration.slow, easing: Easing.bezier(...theme.motion.easing.spring) }
    opacity.value = withDelay(delay, withTiming(1, config))
    translateY.value = withDelay(delay, withTiming(0, config))
    // Entrance runs once on mount; index/reduced are stable for a given row.
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
