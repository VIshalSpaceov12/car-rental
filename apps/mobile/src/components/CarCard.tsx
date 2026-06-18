import { Image, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { Vehicle } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { Card } from './Card'
import { Icon } from './Icon'
import { SpecItem } from './SpecItem'
import { horsepowerFor, transmissionLabel } from '../features/browse/vehicleSpecs'

// Photo heights per variant — one-off layout dimensions (static, not brand tokens).
const PHOTO_HEIGHT = { collection: 150, list: 190 } as const
// Bookmark control on the photo.
const BOOKMARK_DIM = 36

type Variant = keyof typeof PHOTO_HEIGHT

/**
 * The collection / list car card: a white {@link Card} with a rounded car photo,
 * a bookmark control on the photo's inline-end, the car name, an accent price +
 * "per day" hint, and a spec row (hp · transmission · seats). One component, two
 * sizes: `collection` (Home) and the taller `list` (All Cars).
 */
export function CarCard({
  vehicle,
  variant = 'collection',
  saved = false,
  onPress,
  onToggleSave,
}: {
  vehicle: Vehicle
  variant?: Variant
  saved?: boolean
  onPress: () => void
  onToggleSave?: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const image = vehicle.images[0]

  return (
    <Card onPress={onPress} style={{ marginBottom: theme.spacing.lg, gap: theme.spacing.md }}>
      {/* Photo with the bookmark control overlaid on the inline-end. */}
      <View
        style={{
          height: PHOTO_HEIGHT[variant],
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: theme.color.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Icon name="car" size={theme.size.icon.hero} color={theme.color.textSubtle} />
        )}
        <Pressable
          onPress={onToggleSave}
          disabled={!onToggleSave}
          accessibilityRole="button"
          accessibilityLabel={t('common.save')}
          accessibilityState={{ selected: saved }}
          hitSlop={theme.spacing.sm}
          style={{
            position: 'absolute',
            top: theme.spacing.sm,
            end: theme.spacing.sm,
            width: BOOKMARK_DIM,
            height: BOOKMARK_DIM,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.surface,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.elevation.sm,
          }}
        >
          <Icon
            name={saved ? 'bookmark' : 'bookmarkOutline'}
            size={theme.size.icon.md}
            color={saved ? theme.color.accent : theme.color.text}
          />
        </Pressable>
      </View>

      {/* Name + accent price. */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.sm }}>
        <Text
          style={{ flex: 1, color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}
          numberOfLines={1}
        >
          {vehicle.name}
        </Text>
        <Text style={{ color: theme.color.accent, fontSize: theme.typography.title.fontSize, fontWeight: '800' }}>
          {t('common.pricePerDay', { price: vehicle.pricePerDay, currency: vehicle.currency })}
        </Text>
      </View>

      {/* Spec row: hp · transmission · seats. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, flexWrap: 'wrap' }}>
        <SpecItem icon="horsepower" value={t('specs.horsepower', { value: horsepowerFor(vehicle.id) })} />
        <SpecItem icon="transmission" value={transmissionLabel(vehicle)} />
        <SpecItem icon="seat" value={t('specs.seatsValue', { count: vehicle.seats })} />
      </View>
    </Card>
  )
}
