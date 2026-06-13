import { ImageBackground, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { Vehicle } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'
import { RatingBadge } from './RatingBadge'

// One-off card dimensions for the horizontal trend carousel.
const CARD_WIDTH = 230
const CARD_HEIGHT = 180
const HEART_DIM = 34

/** Horizontal "Top trends" card: photo + scrim, name + heart, price + rating. */
export function CarTrendCard({
  vehicle,
  rating,
  trips,
  onPress,
}: {
  vehicle: Vehicle
  rating: number
  trips?: number
  onPress: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const image = vehicle.images[0]
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: theme.radius.card,
        overflow: 'hidden',
        marginEnd: theme.spacing.md,
        backgroundColor: theme.color.surfaceAlt,
      }}
    >
      <ImageBackground source={image ? { uri: image } : undefined} style={{ flex: 1 }} resizeMode="cover">
        <View style={{ flex: 1, backgroundColor: theme.color.overlay, padding: theme.spacing.md, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <View
              style={{
                width: HEART_DIM,
                height: HEART_DIM,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.color.overlay,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="heartOutline" size={theme.size.icon.md} color={theme.color.text} />
            </View>
          </View>

          <View>
            <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '700' }}>
              {vehicle.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
              <View>
                <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}>
                  {vehicle.pricePerDay} {vehicle.currency}
                </Text>
                <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
                  {t('common.perDay')}
                </Text>
              </View>
              <RatingBadge value={rating} trips={trips} />
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  )
}
