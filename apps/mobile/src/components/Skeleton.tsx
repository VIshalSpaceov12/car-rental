import { useEffect } from 'react'
import { View, type DimensionValue } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@car-rental/tokens'
import { useReducedMotion } from './useReducedMotion'

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient)

/** Width of the moving highlight band; also the +/- travel of its sweep. */
const SHIMMER_WIDTH = 200

/**
 * Shimmering placeholder for list/detail load states (replaces ActivityIndicator).
 * A translucent highlight sweeps across a muted block. With reduce-motion on, it
 * renders as a static block (no sweep).
 */
export function Skeleton({
  width = '100%',
  height,
  radius,
}: {
  width?: DimensionValue
  height: number
  radius?: number
}) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const progress = useSharedValue(0)

  useEffect(() => {
    if (reduced) return
    progress.value = withRepeat(
      withTiming(1, { duration: theme.motion.duration.hero * 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    )
  }, [reduced, progress, theme.motion.duration.hero])

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-SHIMMER_WIDTH, SHIMMER_WIDTH]) }],
  }))

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius ?? theme.radius.md,
        backgroundColor: theme.color.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      {!reduced && (
        <AnimatedGradient
          colors={['transparent', theme.color.surface, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[{ position: 'absolute', top: 0, bottom: 0, width: SHIMMER_WIDTH }, sweepStyle]}
        />
      )}
    </View>
  )
}
