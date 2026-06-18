import { Image, Pressable, Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'

// Brand tile diameter — a one-off layout dimension for the "All Brands" row.
const TILE_DIM = 64
// Monogram glyph occupies ~36% of the tile.
const MONOGRAM_RATIO = 0.36

/**
 * Circular brand logo tile for the "All Brands" row: a bordered white surface
 * with the brand mark centered. Falls back to the brand's initial monogram when
 * no `logoUri` asset is provided.
 */
export function BrandChip({
  name,
  logoUri,
  onPress,
}: {
  name: string
  logoUri?: string
  onPress?: () => void
}) {
  const theme = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name} style={{ alignItems: 'center', gap: theme.spacing.xs }}>
      <View
        style={{
          width: TILE_DIM,
          height: TILE_DIM,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.color.surface,
          borderWidth: 1,
          borderColor: theme.color.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...theme.elevation.sm,
        }}
      >
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={{ width: TILE_DIM, height: TILE_DIM }} resizeMode="contain" />
        ) : (
          <Text style={{ color: theme.color.text, fontSize: TILE_DIM * MONOGRAM_RATIO, fontWeight: '800' }}>
            {(name.trim()[0] ?? '?').toUpperCase()}
          </Text>
        )}
      </View>
      <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  )
}
