import { useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import type { VehicleFilters } from '@car-rental/types'
import { useVehiclesQuery } from '../../store/fleetApi'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { toggleFavorite } from '../../store/favoritesSlice'
import { ScreenHeader } from '../../components/ScreenHeader'
import { TextInput } from '../../components/TextInput'
import { CarCard } from '../../components/CarCard'
import { Button } from '../../components/Button'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedListItem } from '../../components/AnimatedListItem'
import { FilterSheet } from './FilterSheet'
import type { RootStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'AllCars'>

const BASE_FILTERS: VehicleFilters = { available: true }
const SKELETON_ROWS = 3
const LIST_SKELETON_HEIGHT = 280

/**
 * "All Cars" listing: header (back + title + search toggle), a live search field,
 * a scroll of taller car cards, and a floating "Filter" pill that opens the
 * existing FilterSheet. Search is a client-side name match over the fetched set.
 */
export function AllCarsScreen({ navigation, route }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const favoriteIds = useAppSelector((s) => s.favorites.ids)
  const [filters, setFilters] = useState<VehicleFilters>(BASE_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  // Tapping a brand chip on Home opens here pre-filtered to that brand; the field
  // stays editable so the customer can refine or clear it.
  const [query, setQuery] = useState(route.params?.brand ?? '')
  const { data: vehicles = [], isLoading } = useVehiclesQuery(filters)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? vehicles.filter((v) => v.name.toLowerCase().includes(q)) : vehicles
  }, [vehicles, query])

  const openDetail = (vehicleId: string) => navigation.navigate('VehicleDetail', { vehicleId })

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ paddingTop: insets.top + theme.spacing.sm, paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
        <ScreenHeader
          title={t('allCars.title')}
          onBack={() => navigation.goBack()}
          actionIcon="search"
          actionLabel={t('common.search')}
          onAction={() => setFilterOpen(true)}
        />
        <TextInput
          icon="search"
          placeholder={t('allCars.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          accessibilityLabel={t('common.search')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: insets.bottom + theme.spacing.xxl * 2,
        }}
      >
        {isLoading ? (
          <View style={{ gap: theme.spacing.lg }}>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <Skeleton key={i} height={LIST_SKELETON_HEIGHT} radius={theme.radius.card} />
            ))}
          </View>
        ) : results.length === 0 ? (
          <Text style={{ color: theme.color.textMuted, textAlign: 'center', marginTop: theme.spacing.xxl }}>
            {t('browse.noVehicles')}
          </Text>
        ) : (
          results.map((v, i) => (
            <AnimatedListItem key={v.id} index={i}>
              <CarCard
                vehicle={v}
                variant="list"
                onPress={() => openDetail(v.id)}
                saved={favoriteIds.includes(v.id)}
                onToggleSave={() => dispatch(toggleFavorite(v.id))}
              />
            </AnimatedListItem>
          ))
        )}
      </ScrollView>

      {/* Floating "Filter" pill. */}
      <View
        style={{
          position: 'absolute',
          start: 0,
          end: 0,
          bottom: insets.bottom + theme.spacing.lg,
          alignItems: 'center',
        }}
        pointerEvents="box-none"
      >
        <Button variant="pill" icon="filter" title={t('allCars.filter')} onPress={() => setFilterOpen(true)} />
      </View>

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
