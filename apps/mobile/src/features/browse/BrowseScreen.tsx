import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Vehicle } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { useVehiclesQuery } from '../../store/fleetApi'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { clearAuth } from '../../storage/authStorage'
import type { RootStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Browse'>

export function BrowseScreen({ navigation }: Props) {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { data: vehicles = [], isFetching, refetch } = useVehiclesQuery({ available: true })

  const onLogout = async () => {
    await clearAuth()
    dispatch(logout())
  }

  const renderItem = ({ item }: { item: Vehicle }) => (
    <Pressable
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
      style={{
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.card,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <Text style={{ color: theme.color.text, fontSize: theme.typography.body.fontSize, fontWeight: '600' }}>
        {item.name}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing.xs }}>
        {item.category} · {item.transmission} · {item.seats} seats
      </Text>
      <Text style={{ color: theme.color.primary, marginTop: theme.spacing.xs }}>
        {item.pricePerDay} {item.currency} / day
      </Text>
    </Pressable>
  )

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background, padding: theme.spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <Text style={{ color: theme.color.textMuted }}>Hi, {user?.name}</Text>
        <Text onPress={onLogout} style={{ color: theme.color.primary }}>
          Log out
        </Text>
      </View>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <Text style={{ color: theme.color.textMuted }}>
            {isFetching ? 'Loading…' : 'No vehicles available.'}
          </Text>
        }
      />
    </View>
  )
}
