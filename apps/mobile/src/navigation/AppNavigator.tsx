import { NavigationContainer, DefaultTheme, type Theme as NavTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from '@car-rental/tokens'
import { HomeTabs } from './HomeTabs'
import { VehicleDetailScreen } from '../features/browse/VehicleDetailScreen'
import { BookingFlow } from '../features/booking/BookingFlow'
import { PickupFlow } from '../features/pickup/PickupFlow'
import { ReturnScreen } from '../features/return/ReturnScreen'
import { RatingScreen } from '../features/rating/RatingScreen'
import { ReceiptScreen } from '../features/bookings/ReceiptScreen'
import { useBookingStatusSocket } from '../store/useBookingStatusSocket'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  const theme = useTheme()
  // One authenticated Socket.io connection for the whole logged-in session:
  // booking-status events refetch the bookings list so the UI stays live.
  useBookingStatusSocket()
  // Map our tokens onto React Navigation's theme so screen transitions/backgrounds
  // stay on-brand (no white flash on the dark canvas).
  const navTheme: NavTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.color.primary,
      background: theme.color.background,
      card: theme.color.surface,
      text: theme.color.text,
      border: theme.color.border,
    },
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={HomeTabs} />
        <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
        <Stack.Screen name="Booking">
          {({ navigation, route }) => (
            <BookingFlow initialVehicleId={route.params.vehicleId} onClose={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Pickup">
          {({ navigation, route }) => (
            <PickupFlow
              bookingId={route.params.bookingId}
              vehicleId={route.params.vehicleId}
              onClose={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Return">
          {({ navigation, route }) => (
            <ReturnScreen bookingId={route.params.bookingId} onClose={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Rating">
          {({ navigation, route }) => (
            <RatingScreen bookingId={route.params.bookingId} onClose={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Receipt">
          {({ navigation, route }) => (
            <ReceiptScreen bookingId={route.params.bookingId} onClose={() => navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
