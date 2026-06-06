import { Text, TextInput, View, type TextInputProps } from 'react-native'
import { useTheme } from '@car-rental/tokens'

export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme()
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={{ color: theme.color.text, marginBottom: theme.spacing.xs }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.color.textMuted}
        style={{
          borderWidth: 1,
          borderColor: theme.color.textMuted,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
          color: theme.color.text,
          fontSize: theme.typography.body.fontSize,
        }}
      />
    </View>
  )
}
