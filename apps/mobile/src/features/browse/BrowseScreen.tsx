import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import type { VehicleFilters } from '@car-rental/types'
import { useVehiclesQuery } from '../../store/fleetApi'
import { useAppSelector } from '../../store/hooks'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { SectionHeader } from '../../components/SectionHeader'
import { CarHeroCard } from '../../components/CarHeroCard'
import { CarTrendCard } from '../../components/CarTrendCard'
import { CarListCard } from '../../components/CarListCard'
import { Button } from '../../components/Button'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedListItem } from '../../components/AnimatedListItem'
import { FilterSheet } from './FilterSheet'
import type { HomeTabParamList, RootStackParamList } from '../../navigation/types'

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>

// Presentational rating placeholders, stable per vehicle, until a reviews
// service exists. Derived from the id so a car always shows the same value.
const hash = (id: string, salt: number) => {
  let h = salt
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}
const ratingFor = (id: string) => 4 + (hash(id, 7) % 10) / 10
const tripsFor = (id: string) => 20 + (hash(id, 13) % 80)

// Browse always shows available vehicles; the filter sheet refines from there.
const BASE_FILTERS: VehicleFilters = { available: true }

// Number of skeleton placeholders shown for the "Choose a car" list on load.
const SKELETON_ROWS = 3
const TREND_SKELETON_HEIGHT = 200
const LIST_SKELETON_HEIGHT = 96
// Vertical padding for the glass search pill (mockup: 13px block padding).
const SEARCH_PAD_Y = 13

export function BrowseScreen({ navigation }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)
  const [filters, setFilters] = useState<VehicleFilters>(BASE_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const { data: vehicles = [], isLoading, isError, refetch } = useVehiclesQuery(filters)

  const openDetail = (vehicleId: string) => navigation.navigate('VehicleDetail', { vehicleId })

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl * 2,
        }}
      >
        {/* Greeting header — greeting block on the inline-start, avatar on the end. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
              {t('browse.tagline')}
            </Text>
            <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}>
              {t('browse.greeting', { name: user?.name ?? t('browse.greetingFallback') })}
            </Text>
          </View>
          <Avatar name={user?.name} />
        </View>

        {/* Glass search pill — opens the filter sheet (no dedicated search route yet). */}
        <Pressable
          accessibilityRole="search"
          accessibilityLabel={t('common.search')}
          onPress={() => setFilterOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: SEARCH_PAD_Y,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.color.border,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Icon name="search" size={theme.size.icon.md} color={theme.color.textSubtle} />
          <Text style={{ color: theme.color.textSubtle, fontSize: theme.typography.caption.fontSize }}>
            {t('common.searchPlaceholder')}
          </Text>
        </Pressable>

        {isLoading ? (
          <View style={{ gap: theme.spacing.md }}>
            <Skeleton height={TREND_SKELETON_HEIGHT} radius={theme.radius.card} />
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <Skeleton key={i} height={LIST_SKELETON_HEIGHT} radius={theme.radius.card} />
            ))}
          </View>
        ) : isError ? (
          <View style={{ alignItems: 'center', marginTop: theme.spacing.xxl, gap: theme.spacing.md }}>
            <Text style={{ color: theme.color.danger, textAlign: 'center' }}>{t('browse.loadError')}</Text>
            <Button title={t('common.retry')} onPress={() => void refetch()} />
          </View>
        ) : vehicles.length === 0 ? (
          <>
            {/* Keep the filter affordance reachable so an over-narrow filter can be widened. */}
            <SectionHeader title={t('browse.chooseACar')} onFilter={() => setFilterOpen(true)} />
            <Text style={{ color: theme.color.textMuted, textAlign: 'center', marginTop: theme.spacing.xl }}>
              {t('browse.noVehicles')}
            </Text>
          </>
        ) : (
          <>
            {/* Top Trends — single full-width hero (the focal element). */}
            <SectionHeader title={t('browse.topTrends')} onSeeAll={() => setFilterOpen(true)} />
            <CarHeroCard
              vehicle={vehicles[0]!}
              rating={ratingFor(vehicles[0]!.id)}
              badgeLabel={t('browse.topTrendBadge')}
              onPress={() => openDetail(vehicles[0]!.id)}
            />

            {/* Secondary trend carousel below the hero (remaining popular cars). */}
            {vehicles.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: theme.spacing.lg, marginHorizontal: -theme.spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
              >
                {vehicles.slice(1).map((v) => (
                  <CarTrendCard key={v.id} vehicle={v} rating={ratingFor(v.id)} trips={tripsFor(v.id)} onPress={() => openDetail(v.id)} />
                ))}
              </ScrollView>
            )}

            {/* Choose a car list */}
            <SectionHeader title={t('browse.chooseACar')} onFilter={() => setFilterOpen(true)} />
            {vehicles.map((v, i) => (
              <AnimatedListItem key={v.id} index={i}>
                <CarListCard vehicle={v} rating={ratingFor(v.id)} onPress={() => openDetail(v.id)} />
              </AnimatedListItem>
            ))}
          </>
        )}
      </ScrollView>

      <FilterSheet
        visible={filterOpen}
        initial={filters}
        onApply={(next) => {
          setFilters(next)
          setFilterOpen(false)
        }}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  )
}
