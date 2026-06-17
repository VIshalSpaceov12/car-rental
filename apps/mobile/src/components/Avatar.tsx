import { Image, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@car-rental/tokens'

// Glyph occupies 40% of the avatar diameter.
const INITIAL_RATIO = 0.4

/**
 * Circular avatar. A photo when present; otherwise a gradient-filled disc with a
 * brand glow showing the name's initial (matches the Midnight GT mockup).
 */
export function Avatar({ uri, name, size }: { uri?: string; name?: string; size?: number }) {
  const theme = useTheme()
  const dim = size ?? theme.size.touchTarget
  const radius = dim / 2

  if (uri) {
    return <Image source={{ uri }} style={{ width: dim, height: dim, borderRadius: radius }} />
  }
  return (
    <LinearGradient
      colors={theme.color.gradientPrimary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.color.glow,
        shadowOpacity: 1,
        shadowRadius: theme.elevation.md.shadowRadius,
        shadowOffset: theme.elevation.md.shadowOffset,
        elevation: theme.elevation.md.elevation,
      }}
    >
      <Text style={{ color: theme.color.onPrimary, fontSize: dim * INITIAL_RATIO, fontWeight: '700' }}>
        {(name?.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </LinearGradient>
  )
}
