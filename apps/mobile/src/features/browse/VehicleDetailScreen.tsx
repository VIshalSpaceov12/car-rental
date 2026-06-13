import { Image, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import { useVehicleQuery } from '../../store/fleetApi'
import { Icon } from '../../components/Icon'
import { CircleButton } from '../../components/CircleButton'
import { ScreenHeader } from '../../components/ScreenHeader'
import { FeatureTile } from '../../components/FeatureTile'
import { CtaBar } from '../../components/CtaBar'
import type { RootStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>

// Hero media height — a one-off layout dimension, not a shared token.
const MEDIA_HEIGHT = 220

export function VehicleDetailScreen({ route, navigation }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const { data: v, isLoading } = useVehicleQuery(route.params.vehicleId)

  if (isLoading || !v) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.color.background }}>
        <Text style={{ color: theme.color.textMuted }}>{t('common.loading')}</Text>
      </View>
    )
  }

  const heroImage = v.images[0]

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ paddingTop: insets.top + theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}>
        <ScreenHeader title={t('detail.title')} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        {heroImage ? (
          <Image
            source={{ uri: heroImage }}
            style={{ width: '100%', height: MEDIA_HEIGHT, marginVertical: theme.spacing.lg }}
            resizeMode="contain"
          />
        ) : (
          <View
            accessibilityLabel={t('detail.noImage')}
            style={{
              width: '100%',
              height: MEDIA_HEIGHT,
              marginVertical: theme.spacing.lg,
              borderRadius: theme.radius.card,
              backgroundColor: theme.color.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="car" size={theme.size.icon.hero} color={theme.color.textSubtle} />
          </View>
        )}

        {/* Info card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            gap: theme.spacing.md,
          }}
        >
          <View
            style={{
              width: theme.size.control.sm,
              height: theme.size.control.sm,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="car" size={theme.size.icon.lg} color={theme.color.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '700' }}>
              {v.name}
            </Text>
            <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
              {t('common.pricePerDay', { price: v.pricePerDay, currency: v.currency })}
            </Text>
          </View>
          <CircleButton icon="heartOutline" variant="surface" size="sm" accessibilityLabel={t('detail.save')} onPress={() => {}} />
        </View>

        {/* Spec grid (from real Vehicle fields) */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <FeatureTile icon="gearbox" title={cap(v.transmission)} subtitle={t('detail.gearBox')} />
          <FeatureTile icon="seat" title={`${v.seats}`} subtitle={t('detail.seats')} />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <FeatureTile icon="fuel" title={cap(v.fuelType)} subtitle={t('detail.fuelType')} />
          <FeatureTile icon="car" title={cap(v.category)} subtitle={t('detail.class')} />
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: insets.bottom + theme.spacing.md, paddingTop: theme.spacing.sm }}>
        <CtaBar label={t('detail.bookNow')} icon="check" onPress={() => navigation.navigate('Booking', { vehicleId: v.id })} />
      </View>
    </View>
  )
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
