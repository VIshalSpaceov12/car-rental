import { useState } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import { useVehicleQuery } from '../../store/fleetApi'
import { Icon } from '../../components/Icon'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SpecCard } from '../../components/SpecCard'
import { Thumbnails } from '../../components/Thumbnails'
import { Button } from '../../components/Button'
import { AnimatedListItem } from '../../components/AnimatedListItem'
import { engineFor, fuelLabel, transmissionLabel } from './vehicleSpecs'
import type { RootStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>

// Hero media height — a one-off layout dimension, not a shared token.
const HERO_HEIGHT = 220
// Lines of the description shown before "Read More" expands it.
const COLLAPSED_LINES = 3

export function VehicleDetailScreen({ route, navigation }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const { data: v, isLoading } = useVehicleQuery(route.params.vehicleId)
  const [selected, setSelected] = useState(0)
  const [expanded, setExpanded] = useState(false)

  if (isLoading || !v) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.color.background }}>
        <Text style={{ color: theme.color.textMuted }}>{t('common.loading')}</Text>
      </View>
    )
  }

  const heroImage = v.images[selected] ?? v.images[0]

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ paddingTop: insets.top + theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}>
        <ScreenHeader
          onBack={() => navigation.goBack()}
          actionIcon="heartOutline"
          actionLabel={t('detail.save')}
          onAction={() => {}}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        {/* Hero photo on the light backdrop. */}
        <View
          style={{
            height: HERO_HEIGHT,
            marginVertical: theme.spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Icon name="car" size={theme.size.icon.hero} color={theme.color.textSubtle} />
          )}
        </View>

        {/* Gallery thumbnails (hidden for a single image). */}
        <Thumbnails images={v.images} selectedIndex={selected} onSelect={setSelected} />

        {/* Name + accent price. */}
        <AnimatedListItem index={0}>
          <View style={{ marginTop: theme.spacing.lg }}>
            <Text style={{ color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: '700' }}>
              {v.name}
            </Text>
            <Text style={{ color: theme.color.accent, fontSize: theme.typography.title.fontSize, fontWeight: '800', marginTop: theme.spacing.xs }}>
              {t('common.pricePerDay', { price: v.pricePerDay, currency: v.currency })}
            </Text>
          </View>
        </AnimatedListItem>

        {/* 2×2 spec grid. */}
        <AnimatedListItem index={1}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
            <SpecCard icon="engine" label={t('specs.engine')} value={engineFor(v)} />
            <SpecCard icon="fuel" label={t('specs.fuelType')} value={fuelLabel(v)} />
          </View>
        </AnimatedListItem>
        <AnimatedListItem index={2}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
            <SpecCard icon="transmission" label={t('specs.transmission')} value={transmissionLabel(v)} />
            <SpecCard icon="seat" label={t('specs.seats')} value={t('specs.seatsValue', { count: v.seats })} />
          </View>
        </AnimatedListItem>

        {/* Descriptions + Read More. */}
        <AnimatedListItem index={3}>
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700', marginBottom: theme.spacing.sm }}>
              {t('detail.descriptions')}
            </Text>
            <Text
              numberOfLines={expanded ? undefined : COLLAPSED_LINES}
              style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize, lineHeight: theme.typography.body.lineHeight }}
            >
              {t('detail.descriptionBody')}
            </Text>
            <Button
              variant="ghost"
              fullWidth={false}
              title={expanded ? t('detail.readLess') : t('detail.readMore')}
              onPress={() => setExpanded((e) => !e)}
            />
          </View>
        </AnimatedListItem>
      </ScrollView>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: insets.bottom + theme.spacing.md, paddingTop: theme.spacing.sm }}>
        <Button title={t('detail.bookNow')} onPress={() => navigation.navigate('Booking', { vehicleId: v.id })} />
      </View>
    </View>
  )
}
