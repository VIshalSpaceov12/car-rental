import { Pressable, View, type ViewStyle } from 'react-native'
import { useTheme } from '@car-rental/tokens'

type Tone = 'surface' | 'surfaceAlt'

/**
 * Base white surface card — the foundation for car cards and spec cards. Soft
 * shadow via `theme.elevation`, default radius.card (24), padding via `theme.spacing`.
 * Pass `onPress` to make the whole card a tappable surface (the car cards do).
 * `tone` swaps the fill to `surfaceAlt` for inset tiles (spec cards).
 */
export function Card({
  children,
  onPress,
  tone = 'surface',
  padding,
  radius,
  elevated = true,
  style,
}: {
  children: React.ReactNode
  onPress?: () => void
  tone?: Tone
  padding?: number
  radius?: number
  elevated?: boolean
  style?: ViewStyle
}) {
  const theme = useTheme()
  const base: ViewStyle = {
    backgroundColor: tone === 'surface' ? theme.color.surface : theme.color.surfaceAlt,
    borderRadius: radius ?? theme.radius.card,
    padding: padding ?? theme.spacing.md,
    ...(elevated ? theme.elevation.sm : null),
  }

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1 }, style]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[base, style]}>{children}</View>
}
