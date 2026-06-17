import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'
import { useReducedMotion } from './useReducedMotion'

const TAB_ICON: Record<string, IconName> = {
  Home: 'home',
  Bookings: 'calendar',
  Settings: 'settings',
}

/** Floating pill tab bar (matches the reference): active tab = red circle. */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        position: 'absolute',
        start: 0,
        end: 0,
        bottom: insets.bottom + theme.spacing.sm,
        alignItems: 'center',
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.sm,
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.pill,
          padding: theme.spacing.xs,
          ...theme.elevation.lg,
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
          }
          return (
            <TabItem
              key={route.key}
              focused={focused}
              icon={TAB_ICON[route.name] ?? 'home'}
              label={route.name}
              onPress={onPress}
            />
          )
        })}
      </View>
    </View>
  )
}

/**
 * Single tab cell. The active indicator is a gradient circle + glow that scales
 * in (and fades) when focused, giving the selection an animated pop instead of a
 * hard background swap. Reduce-motion renders the indicator at its final state.
 */
function TabItem({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean
  icon: IconName
  label: string
  onPress: () => void
}) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const progress = useSharedValue(focused ? 1 : 0)

  useEffect(() => {
    const target = focused ? 1 : 0
    progress.value = reduced
      ? target
      : withTiming(target, {
          // Overshoot/bounce so the active indicator pops in (mockup ease-spring).
          duration: theme.motion.duration.base,
          easing: Easing.bezier(...theme.motion.easing.spring),
        })
  }, [focused, reduced, progress, theme.motion])

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }))

  const SIZE = theme.size.control.md

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          indicatorStyle,
          {
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            borderRadius: theme.radius.pill,
            shadowColor: theme.color.glow,
            shadowOpacity: 1,
            shadowRadius: theme.elevation.md.shadowRadius,
            shadowOffset: theme.elevation.md.shadowOffset,
            elevation: theme.elevation.md.elevation,
          },
        ]}
      >
        <LinearGradient
          colors={theme.color.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: SIZE, height: SIZE, borderRadius: theme.radius.pill }}
        />
      </Animated.View>
      <Icon name={icon} size={theme.size.icon.xl} color={focused ? theme.color.onPrimary : theme.color.textMuted} />
    </Pressable>
  )
}
