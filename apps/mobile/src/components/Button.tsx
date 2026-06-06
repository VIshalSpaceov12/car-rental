import { Pressable, Text } from 'react-native'
import { useTheme } from '@car-rental/tokens'

export function Button({
  title,
  onPress,
  disabled,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
}) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? theme.color.textMuted : theme.color.primary,
        borderRadius: theme.radius.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: theme.color.onPrimary, fontSize: theme.typography.body.fontSize }}>
        {title}
      </Text>
    </Pressable>
  )
}
