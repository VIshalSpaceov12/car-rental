import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

const TAB_ICON: Record<string, IconName> = {
  Home: 'home',
  Bookings: 'clock',
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
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={route.name}
              style={{
                width: theme.size.control.md,
                height: theme.size.control.md,
                borderRadius: theme.radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? theme.color.primary : 'transparent',
              }}
            >
              <Icon
                name={TAB_ICON[route.name] ?? 'home'}
                size={theme.size.icon.xl}
                color={focused ? theme.color.onPrimary : theme.color.textMuted}
              />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
