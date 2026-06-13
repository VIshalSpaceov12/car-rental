import { ImageBackground, Pressable, Text, View } from 'react-native'
import type { Vehicle } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'
import { RatingBadge } from './RatingBadge'

// One-off card height for the vertical "Choose a car" list.
const CARD_HEIGHT = 160

/** Vertical "Choose a car" card: photo + scrim, name/subtitle, rating, price, arrow. */
export function CarListCard({
  vehicle,
  rating,
  onPress,
}: {
  vehicle: Vehicle
  rating: number
  onPress: () => void
}) {
  const theme = useTheme()
  const image = vehicle.images[0]
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: CARD_HEIGHT,
        borderRadius: theme.radius.card,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
        backgroundColor: theme.color.surfaceAlt,
      }}
    >
      <ImageBackground source={image ? { uri: image } : undefined} style={{ flex: 1 }} resizeMode="cover">
        <View style={{ flex: 1, backgroundColor: theme.color.overlay, padding: theme.spacing.md, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}>
                {vehicle.name}
              </Text>
              <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, textTransform: 'capitalize' }}>
                {vehicle.category} · {vehicle.transmission}
              </Text>
            </View>
            <RatingBadge value={rating} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View
              style={{
                width: theme.size.touchTarget,
                height: theme.size.touchTarget,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.color.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="arrowRight" size={theme.size.icon.lg} color={theme.color.onPrimary} />
            </View>
            <Text style={{ color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: '700' }}>
              {vehicle.pricePerDay} {vehicle.currency}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  )
}
