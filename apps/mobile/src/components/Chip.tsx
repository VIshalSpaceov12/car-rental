import { Pressable, Text } from 'react-native'
import { useTheme } from '@car-rental/tokens'

/**
 * Small pill for filters / tags. `selected` flips it to the ink primary fill;
 * otherwise it sits on the neutral surfaceAlt. Tappable when `onPress` is given.
 */
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string
  selected?: boolean
  onPress?: () => void
}) {
  const theme = useTheme()
  const body = (
    <Text
      style={{
        color: selected ? theme.color.onPrimary : theme.color.text,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: '500',
      }}
    >
      {label}
    </Text>
  )
  const containerStyle = {
    alignSelf: 'flex-start' as const,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: selected ? theme.color.primary : theme.color.surfaceAlt,
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={containerStyle}
      >
        {body}
      </Pressable>
    )
  }
  return <Pressable disabled style={containerStyle}>{body}</Pressable>
}
