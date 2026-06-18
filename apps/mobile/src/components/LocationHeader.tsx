import { Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

/**
 * Home header: a pin + city label (muted caption over the city text) on the
 * inline-start, an Avatar (photo or initial) on the inline-end.
 */
export function LocationHeader({
  city,
  label,
  userName,
  avatarUri,
}: {
  city: string
  label: string
  userName?: string
  avatarUri?: string
}) {
  const theme = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Icon name="pin" size={theme.size.icon.md} color={theme.color.text} />
          <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '600' }}>
            {city}
          </Text>
        </View>
      </View>
      <Avatar uri={avatarUri} name={userName} size={theme.size.control.sm} />
    </View>
  )
}
