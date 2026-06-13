import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
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
import { SectionHeader } from '../../components/SectionHeader'
import { CarTrendCard } from '../../components/CarTrendCard'
import { CarListCard } from '../../components/CarListCard'
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

export function BrowseScreen({ navigation }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)
  const [filters, setFilters] = useState<VehicleFilters>(BASE_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const { data: vehicles = [], isFetching } = useVehiclesQuery(filters)

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
        {/* Greeting header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Avatar name={user?.name} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}>
              {t('browse.greeting', { name: user?.name ?? t('browse.greetingFallback') })}
            </Text>
            <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
              {t('browse.tagline')}
            </Text>
          </View>
        </View>

        {/* Top trends carousel */}
        <SectionHeader title={t('browse.topTrends')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: theme.spacing.lg, marginHorizontal: -theme.spacing.lg }}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
        >
          {vehicles.map((v) => (
            <CarTrendCard key={v.id} vehicle={v} rating={ratingFor(v.id)} trips={tripsFor(v.id)} onPress={() => openDetail(v.id)} />
          ))}
        </ScrollView>

        {/* Choose a car list */}
        <SectionHeader title={t('browse.chooseACar')} onFilter={() => setFilterOpen(true)} />
        {vehicles.map((v) => (
          <CarListCard key={v.id} vehicle={v} rating={ratingFor(v.id)} onPress={() => openDetail(v.id)} />
        ))}

        {vehicles.length === 0 && (
          <Text style={{ color: theme.color.textMuted, textAlign: 'center', marginTop: theme.spacing.xl }}>
            {isFetching ? t('common.loading') : t('browse.noVehicles')}
          </Text>
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
