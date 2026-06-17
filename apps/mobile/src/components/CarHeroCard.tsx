import { I18nManager, ImageBackground, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import type { Vehicle } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'
import { RatingBadge } from './RatingBadge'

// Hero anatomy (mockup): 16/11 image, 46px FAB, 19px name, 18px price amount,
// 10px uppercase "Top trend" badge. Static layout consts (not brand-themeable).
const HERO_ASPECT = 16 / 11
const FAB_DIM = 46
const NAME_FONT_SIZE = 19
const PRICE_FONT_SIZE = 18
const BADGE_FONT_SIZE = 10
const BADGE_TRACKING = 1
const SCRIM_END = 0.55

/**
 * Full-width "Top Trends" hero: photo + bottom scrim, a gradient "Top trend"
 * badge on the inline-start, the car name/meta/rating, and a stacked price over a
 * circular gradient FAB on the inline-end. The focal element of the Browse screen.
 */
export function CarHeroCard({
  vehicle,
  rating,
  badgeLabel,
  onPress,
}: {
  vehicle: Vehicle
  rating: number
  badgeLabel: string
  onPress: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const image = vehicle.images[0]
  return (
    <Pressable
      onPress={onPress}
      style={{
        aspectRatio: HERO_ASPECT,
        borderRadius: theme.radius.card,
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.color.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.color.border,
        ...theme.elevation.lg,
      }}
    >
      <ImageBackground source={image ? { uri: image } : undefined} style={{ flex: 1 }} resizeMode="cover">
        {/* Bottom-up scrim so the info stays legible over any photo. */}
        <LinearGradient
          colors={['transparent', theme.color.overlay]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[SCRIM_END, 1]}
          style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0 }}
        />

        {/* "Top trend" gradient badge, inline-start top. */}
        <LinearGradient
          colors={theme.color.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: theme.spacing.md,
            start: theme.spacing.md,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.radius.pill,
            shadowColor: theme.color.glow,
            shadowOpacity: 1,
            shadowRadius: theme.elevation.md.shadowRadius,
            shadowOffset: theme.elevation.md.shadowOffset,
            elevation: theme.elevation.md.elevation,
          }}
        >
          <Text
            style={{
              color: theme.color.onPrimary,
              fontSize: BADGE_FONT_SIZE,
              fontWeight: '700',
              letterSpacing: BADGE_TRACKING,
              textTransform: 'uppercase',
            }}
          >
            {badgeLabel}
          </Text>
        </LinearGradient>

        {/* Bottom info row: name/meta/rating on the start, price + FAB on the end. */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            start: 0,
            end: 0,
            padding: theme.spacing.md,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: theme.spacing.sm,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: theme.color.text, fontSize: NAME_FONT_SIZE, fontWeight: '700' }}>
              {vehicle.name}
            </Text>
            <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, textTransform: 'capitalize' }}>
              {vehicle.category} · {vehicle.transmission}
            </Text>
            <View style={{ marginTop: theme.spacing.xs }}>
              <RatingBadge value={rating} />
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: theme.spacing.sm }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.color.text, fontSize: PRICE_FONT_SIZE, fontWeight: '800' }}>
                {vehicle.pricePerDay} {vehicle.currency}
              </Text>
              <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
                {t('common.perDay')}
              </Text>
            </View>
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
                <Icon name="arrowRight" size={theme.size.icon.lg} color={theme.color.onPrimary} />
              </View>
            </LinearGradient>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  )
}
