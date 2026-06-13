import { Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { CircleButton } from './CircleButton'
import type { IconName } from './Icon'

/** Details-style header: back button + centered title + optional action (search). */
export function ScreenHeader({
  title,
  onBack,
  actionIcon,
  onAction,
}: {
  title: string
  onBack?: () => void
  actionIcon?: IconName
  onAction?: () => void
}) {
  const theme = useTheme()
  // Spacer matches the small CircleButton so the centered title stays centered.
  const slot = theme.size.control.sm
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {onBack ? (
        <CircleButton icon="back" variant="surface" size="sm" onPress={onBack} accessibilityLabel="Go back" />
      ) : (
        <View style={{ width: slot }} />
      )}
      <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '600' }}>
        {title}
      </Text>
      {actionIcon && onAction ? (
        <CircleButton icon={actionIcon} variant="surface" size="sm" onPress={onAction} accessibilityLabel={title} />
      ) : (
        <View style={{ width: slot }} />
      )}
    </View>
  )
}
