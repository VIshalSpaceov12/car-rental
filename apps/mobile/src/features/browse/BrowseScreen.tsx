import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import type { Vehicle, VehicleFilters } from '@car-rental/types'
import { useVehiclesQuery } from '../../store/fleetApi'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { toggleFavorite } from '../../store/favoritesSlice'
import { LocationHeader } from '../../components/LocationHeader'
import { SectionHeader } from '../../components/SectionHeader'
import { BrandChip } from '../../components/BrandChip'
import { CarCard } from '../../components/CarCard'
import { Button } from '../../components/Button'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedListItem } from '../../components/AnimatedListItem'
import type { HomeTabParamList, RootStackParamList } from '../../navigation/types'

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>

// Browse always shows available vehicles; the All-Cars filter sheet refines further.
const BASE_FILTERS: VehicleFilters = { available: true }
const SKELETON_ROWS = 2
const HERO_SKELETON_HEIGHT = 120
const COLLECTION_SKELETON_HEIGHT = 280
// Max brand chips shown in the "All Brands" row.
const MAX_BRANDS = 6

/**
 * Derive a brand list from the fleet until a Brand entity exists on the API: take
 * the first word of each vehicle name as the brand mark (placeholder), de-duped
 * and order-preserved. A reasonable stand-in for the design's logo chips.
 */
function brandsFrom(vehicles: Vehicle[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of vehicles) {
    const brand = v.name.trim().split(/\s+/)[0]
    if (brand && !seen.has(brand)) {
      seen.add(brand)
      out.push(brand)
    }
    if (out.length >= MAX_BRANDS) break
  }
  return out
}

export function BrowseScreen({ navigation }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const favoriteIds = useAppSelector((s) => s.favorites.ids)
  const { data: vehicles = [], isLoading, isError, refetch } = useVehiclesQuery(BASE_FILTERS)

  const brands = useMemo(() => brandsFrom(vehicles), [vehicles])

  const openDetail = (vehicleId: string) => navigation.navigate('VehicleDetail', { vehicleId })
  const openAllCars = () => navigation.navigate('AllCars')
  const openBrand = (brand: string) => navigation.navigate('AllCars', { brand })

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      {/* Pinned greeting header — stays put while the fleet scrolls. */}
      <View style={{ paddingTop: insets.top + theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        <LocationHeader city={t('browse.location')} label={t('browse.tagline')} userName={user?.name} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl * 2,
        }}
      >
        {/* Hero heading. */}
        <Text
          style={{
            color: theme.color.text,
            fontSize: theme.typography.heading.fontSize,
            fontWeight: '800',
            lineHeight: theme.typography.heading.lineHeight,
            marginTop: theme.spacing.lg,
            marginBottom: theme.spacing.xl,
          }}
        >
          {t('browse.hero')}
        </Text>

        {isLoading ? (
          <View style={{ gap: theme.spacing.lg }}>
            <Skeleton height={HERO_SKELETON_HEIGHT} radius={theme.radius.card} />
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <Skeleton key={i} height={COLLECTION_SKELETON_HEIGHT} radius={theme.radius.card} />
            ))}
          </View>
        ) : isError ? (
          <View style={{ alignItems: 'center', marginTop: theme.spacing.xxl, gap: theme.spacing.md }}>
            <Text style={{ color: theme.color.danger, textAlign: 'center' }}>{t('browse.loadError')}</Text>
            <Button title={t('common.retry')} onPress={() => void refetch()} fullWidth={false} />
          </View>
        ) : vehicles.length === 0 ? (
          <Text style={{ color: theme.color.textMuted, textAlign: 'center', marginTop: theme.spacing.xxl }}>
            {t('browse.noVehicles')}
          </Text>
        ) : (
          <>
            {/* All Brands */}
            <SectionHeader title={t('browse.allBrands')} onAction={openAllCars} actionLabel={t('browse.viewAll')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -theme.spacing.lg, marginBottom: theme.spacing.xl }}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.lg }}
            >
              {brands.map((brand) => (
                <BrandChip key={brand} name={brand} onPress={() => openBrand(brand)} />
              ))}
            </ScrollView>

            {/* All Collections */}
            <SectionHeader title={t('browse.allCollections')} onAction={openAllCars} actionLabel={t('browse.viewAll')} />
            {vehicles.map((v, i) => (
              <AnimatedListItem key={v.id} index={i}>
                <CarCard
                  vehicle={v}
                  variant="collection"
                  onPress={() => openDetail(v.id)}
                  saved={favoriteIds.includes(v.id)}
                  onToggleSave={() => dispatch(toggleFavorite(v.id))}
                />
              </AnimatedListItem>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}
