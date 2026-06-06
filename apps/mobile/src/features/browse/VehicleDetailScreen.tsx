import { ScrollView, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import { useVehicleQuery } from '../../store/fleetApi'
import type { RootStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>

export function VehicleDetailScreen({ route }: Props) {
  const theme = useTheme()
  const { data: v, isLoading } = useVehicleQuery(route.params.vehicleId)

  if (isLoading || !v) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.color.background }}>
        <Text style={{ color: theme.color.textMuted }}>Loading…</Text>
      </View>
    )
  }

  const row = (label: string, value: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
      <Text style={{ color: theme.color.textMuted }}>{label}</Text>
      <Text style={{ color: theme.color.text }}>{value}</Text>
    </View>
  )

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.color.background }} contentContainerStyle={{ padding: theme.spacing.lg }}>
      <Text
        style={{
          color: theme.color.primary,
          fontSize: theme.typography.heading.fontSize,
          fontWeight: theme.typography.heading.fontWeight,
          marginBottom: theme.spacing.md,
        }}
      >
        {v.name}
      </Text>
      {row('Category', v.category)}
      {row('Transmission', v.transmission)}
      {row('Fuel', v.fuelType)}
      {row('Seats', String(v.seats))}
      {row('Price / day', `${v.pricePerDay} ${v.currency}`)}
      {row('Available', v.available ? 'Yes' : 'No')}
      <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing.lg }}>
        Booking flow arrives in Phase 3.
      </Text>
    </ScrollView>
  )
}
