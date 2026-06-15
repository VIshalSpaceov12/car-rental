import type { NavigatorScreenParams } from '@react-navigation/native'

/** Bottom tabs shown once authenticated. */
export type HomeTabParamList = {
  Home: undefined
  Bookings: undefined
  Settings: undefined
}

/** Root native stack: the tabs + the screens pushed over them. */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<HomeTabParamList>
  VehicleDetail: { vehicleId: string }
  Booking: { vehicleId: string }
  // Phase 5: keyless pickup (OTP + contract signing) and vehicle return.
  Pickup: { bookingId: string; vehicleId: string }
  Return: { bookingId: string }
  // Phase 6: post-rental rating and the itemized receipt for a past rental.
  Rating: { bookingId: string }
  Receipt: { bookingId: string }
}
