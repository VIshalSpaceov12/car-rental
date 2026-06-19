import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import type { VehicleFilters } from '@car-rental/types'
import { Icon } from '../../components/Icon'
import { CarCard } from '../../components/CarCard'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedListItem } from '../../components/AnimatedListItem'
import { useVehiclesQuery } from '../../store/fleetApi'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { toggleFavorite } from '../../store/favoritesSlice'
import type { RootStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

// Share the cached fleet list with Home/All-Cars (same key) — no extra request.
const BASE_FILTERS: VehicleFilters = { available: true }
const SKELETON_ROWS = 2
const LIST_SKELETON_HEIGHT = 280

/**
 * Favorites tab — the cars the customer bookmarked (persisted via the favorites
 * slice). Lists saved vehicles newest-first; the bookmark un-saves in place.
 */
export function FavoritesScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigation = useNavigation<Nav>()
  const favoriteIds = useAppSelector((s) => s.favorites.ids)
  const { data: vehicles = [], isLoading } = useVehiclesQuery(BASE_FILTERS)

  // Saved vehicles in save-order (favoriteIds is most-recent-first).
  const saved = useMemo(() => {
    const rank = new Map(favoriteIds.map((id, i) => [id, i]))
    return vehicles.filter((v) => rank.has(v.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!)
  }, [vehicles, favoriteIds])

  const loading = isLoading && favoriteIds.length > 0

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      {/* Pinned title — stays put while the saved list scrolls. */}
      <View style={{ paddingTop: insets.top + theme.spacing.lg, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
        <Text style={{ color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: '700' }}>
          {t('favorites.title')}
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.lg }}>
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Skeleton key={i} height={LIST_SKELETON_HEIGHT} radius={theme.radius.card} />
          ))}
        </View>
      ) : saved.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, padding: theme.spacing.lg }}>
          <Icon name="bookmarkOutline" size={theme.size.icon.hero} color={theme.color.textSubtle} />
          <Text style={{ color: theme.color.textMuted, textAlign: 'center' }}>{t('favorites.empty')}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.xxl * 2,
          }}
        >
          {saved.map((v, i) => (
            <AnimatedListItem key={v.id} index={i}>
              <CarCard
                vehicle={v}
                variant="list"
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v.id })}
                saved
                onToggleSave={() => dispatch(toggleFavorite(v.id))}
              />
            </AnimatedListItem>
          ))}
        </ScrollView>
      )}
    </View>
  )
}
