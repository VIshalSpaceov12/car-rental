import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '@car-rental/tokens'
import type { BookingStatus } from '@car-rental/types'
import { statusColor, statusTint } from './statusChipColor'
import { useReducedMotion } from './useReducedMotion'

// Chip glyph sizing (mockup: ~11px label, 6px leading dot).
const CHIP_FONT_SIZE = 11
const DOT_DIM = 6

/**
 * Booking-lifecycle chip. The role color tints the fill (~0.14 alpha) and colors
 * a leading dot + label, matching the dashboard's chip vocabulary. When the
 * status changes the label/color cross-fade (opacity dip) rather than swapping.
 */
export function StatusChip({ status, label }: { status: BookingStatus; label: string }) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (reduced) return
    opacity.value = withSequence(
      withTiming(0, { duration: theme.motion.duration.fast, easing: Easing.bezier(...theme.motion.easing.exit) }),
      withTiming(1, { duration: theme.motion.duration.base, easing: Easing.bezier(...theme.motion.easing.enter) }),
    )
  }, [status, reduced, opacity, theme.motion])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const color = statusColor(theme, status)

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          backgroundColor: statusTint(theme, status),
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          alignSelf: 'flex-start',
        },
      ]}
    >
      <View style={{ width: DOT_DIM, height: DOT_DIM, borderRadius: theme.radius.pill, backgroundColor: color }} />
      <Text style={{ color, fontSize: CHIP_FONT_SIZE, fontWeight: '700', textTransform: 'capitalize' }}>{label}</Text>
    </Animated.View>
  )
}
