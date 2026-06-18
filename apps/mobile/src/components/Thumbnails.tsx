import { Image, Pressable, ScrollView } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'

// Thumbnail tile size — a one-off layout dimension for the detail gallery strip.
const THUMB_DIM = 64
const SELECTED_BORDER = 2

/**
 * Horizontal strip of rounded image tiles for the detail gallery. The selected
 * tile is outlined with the ink primary border. Hidden entirely when there is
 * fewer than two images (no strip needed for a single hero).
 */
export function Thumbnails({
  images,
  selectedIndex,
  onSelect,
}: {
  images: string[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const theme = useTheme()
  if (images.length < 2) return null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm }}
    >
      {images.map((uri, i) => {
        const selected = i === selectedIndex
        return (
          <Pressable
            key={`${uri}-${i}`}
            onPress={() => onSelect(i)}
            accessibilityRole="imagebutton"
            accessibilityState={{ selected }}
            style={{
              width: THUMB_DIM,
              height: THUMB_DIM,
              borderRadius: theme.radius.md,
              overflow: 'hidden',
              backgroundColor: theme.color.surfaceAlt,
              borderWidth: SELECTED_BORDER,
              borderColor: selected ? theme.color.primary : theme.color.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {uri ? (
              <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Icon name="car" size={theme.size.icon.lg} color={theme.color.textSubtle} />
            )}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
