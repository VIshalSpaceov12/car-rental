import { useState } from 'react'
import { Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

/**
 * Light, premium text input: white surface, 1px border, radius.md, an optional
 * label above and an optional leading icon (e.g. search) inside the field. The
 * border tightens to the ink primary on focus. Used for the All-Cars search and
 * every auth/booking form. Forwards all native `TextInputProps`.
 */
export function TextInput({
  label,
  icon,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label?: string; icon?: IconName }) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <View style={{ marginBottom: label ? theme.spacing.md : theme.spacing.none }}>
      {label ? (
        <Text
          style={{
            color: theme.color.text,
            marginBottom: theme.spacing.xs,
            fontSize: theme.typography.label.fontSize,
            fontWeight: theme.typography.label.fontWeight,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: theme.color.surface,
          borderWidth: 1,
          borderColor: focused ? theme.color.primary : theme.color.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        {icon ? <Icon name={icon} size={theme.size.icon.md} color={theme.color.textSubtle} /> : null}
        <RNTextInput
          {...props}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          placeholderTextColor={theme.color.textSubtle}
          style={[
            {
              flex: 1,
              paddingVertical: theme.spacing.md,
              color: theme.color.text,
              fontSize: theme.typography.body.fontSize,
            },
            style,
          ]}
        />
      </View>
    </View>
  )
}
