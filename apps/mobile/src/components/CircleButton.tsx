import { Pressable } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'surface' | 'glass'
type Size = 'sm' | 'md' | 'lg'

// Glyph occupies ~42% of the control diameter.
const ICON_RATIO = 0.42

/**
 * Circular icon button — the app's recurring affordance: red FAB (`primary`),
 * neutral control on a card (`surface`), or translucent control over a photo
 * (`glass`). Used for Get Started, list-card arrow, Book ✓, search/back/heart.
 */
export function CircleButton({
  icon,
  onPress,
  size = 'md',
  variant = 'primary',
  accessibilityLabel,
}: {
  icon: IconName
  onPress?: () => void
  size?: Size
  variant?: Variant
  accessibilityLabel: string
}) {
  const theme = useTheme()
  const dim = theme.size.control[size]
  const bg: Record<Variant, string> = {
    primary: theme.color.primary,
    surface: theme.color.surfaceAlt,
    glass: theme.color.overlay,
  }
  const fg = variant === 'primary' ? theme.color.onPrimary : theme.color.text

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: dim,
        height: dim,
        borderRadius: theme.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: variant === 'primary' && pressed ? theme.color.primaryDark : bg[variant],
        opacity: pressed && variant !== 'primary' ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={Math.round(dim * ICON_RATIO)} color={fg} />
    </Pressable>
  )
}
