import { Image, Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'

// Glyph occupies 40% of the avatar diameter.
const INITIAL_RATIO = 0.4

/** Circular avatar; falls back to the name's initial on a neutral surface. */
export function Avatar({ uri, name, size }: { uri?: string; name?: string; size?: number }) {
  const theme = useTheme()
  const dim = size ?? theme.size.touchTarget
  const radius = dim / 2

  if (uri) {
    return <Image source={{ uri }} style={{ width: dim, height: dim, borderRadius: radius }} />
  }
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        backgroundColor: theme.color.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.color.text, fontSize: dim * INITIAL_RATIO, fontWeight: '600' }}>
        {(name?.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  )
}
