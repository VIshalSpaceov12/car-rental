import { I18nManager, ImageBackground, Pressable, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { Vehicle } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'
import { RatingBadge } from './RatingBadge'

// One-off dimensions for the compact "Choose a car" row (mockup: 104×78 thumb,
// 36px FAB, 14px price). Static layout — not brand-themeable, so they live here.
const THUMB_WIDTH = 104
const THUMB_HEIGHT = 78
const FAB_DIM = 36
const PRICE_FONT_SIZE = 14

/**
 * Compact horizontal "Choose a car" row: bordered card with a thumbnail on the
 * inline-start, a name/meta body, and a foot row (rating … price + gradient FAB).
 * Matches the Midnight GT list-card anatomy.
 */
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.color.surface,
        borderWidth: 1,
        borderColor: theme.color.border,
      }}
    >
      <ImageBackground
        source={image ? { uri: image } : undefined}
        style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, backgroundColor: theme.color.surfaceAlt }}
        imageStyle={{ borderRadius: theme.radius.sm }}
        resizeMode="cover"
      />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '700' }}>
          {vehicle.name}
        </Text>
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, textTransform: 'capitalize' }}>
          {vehicle.category} · {vehicle.transmission}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing.xs,
          }}
        >
          <RatingBadge value={rating} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Text style={{ color: theme.color.text, fontSize: PRICE_FONT_SIZE, fontWeight: '800' }}>
              {vehicle.pricePerDay} {vehicle.currency}
            </Text>
            <LinearGradient
              colors={theme.color.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: FAB_DIM,
                height: FAB_DIM,
                borderRadius: theme.radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.color.glow,
                shadowOpacity: 1,
                shadowRadius: theme.elevation.md.shadowRadius,
                shadowOffset: theme.elevation.md.shadowOffset,
                elevation: theme.elevation.md.elevation,
              }}
            >
              <View style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}>
                <Icon name="arrowRight" size={theme.size.icon.sm} color={theme.color.onPrimary} />
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Pressable>
  )
}
