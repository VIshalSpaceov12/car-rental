import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

// Per-route icon glyph + i18n label key for the floating tab bar.
const TAB_ICON: Record<string, IconName> = {
  Home: 'home',
  Favorites: 'heart',
  Bookings: 'calendar',
  Settings: 'person',
}
const TAB_LABEL: Record<string, 'nav.home' | 'nav.favorites' | 'nav.bookings' | 'nav.profile'> = {
  Home: 'nav.home',
  Favorites: 'nav.favorites',
  Bookings: 'nav.bookings',
  Settings: 'nav.profile',
}

// Tab control height — a one-off layout dimension for the floating pill.
const TAB_HEIGHT = 48

/**
 * Floating tab bar: a dark RAISED pill (surfaceAlt) above the canvas. Inactive
 * tabs are muted-light icons that stay legible on the dark bar; the ACTIVE tab
 * expands into a brand (primary) pill with a white icon + label and a soft brand
 * glow, so the highlight — not the bar — carries the brand color.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

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
          alignItems: 'center',
          gap: theme.spacing.xs,
          backgroundColor: theme.color.surfaceAlt,
          borderRadius: theme.radius.pill,
          borderWidth: 1,
          borderColor: theme.color.border,
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
          const labelKey = TAB_LABEL[route.name]
          return (
            <TabItem
              key={route.key}
              focused={focused}
              icon={TAB_ICON[route.name] ?? 'home'}
              label={labelKey ? t(labelKey) : route.name}
              onPress={onPress}
            />
          )
        })}
      </View>
    </View>
  )
}

/**
 * Single tab cell. Inactive: a muted-light icon-only target, legible on the dark
 * bar. Active: a brand (primary) pill with a white icon + label and a soft brand
 * glow, so the selected tab clearly stands out.
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

  if (focused) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: true }}
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          height: TAB_HEIGHT,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.color.primary,
          // Brand glow so the active tab reads as lit, not just filled.
          shadowColor: theme.color.primary,
          shadowOpacity: 0.55,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Icon name={icon} size={theme.size.icon.lg} color={theme.color.onPrimary} />
        <Text style={{ color: theme.color.onPrimary, fontSize: theme.typography.caption.fontSize, fontWeight: '700' }}>
          {label}
        </Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: false }}
      accessibilityLabel={label}
      style={{ width: TAB_HEIGHT, height: TAB_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={icon} size={theme.size.icon.lg} color={theme.color.textMuted} />
    </Pressable>
  )
}
