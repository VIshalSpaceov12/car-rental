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
}
