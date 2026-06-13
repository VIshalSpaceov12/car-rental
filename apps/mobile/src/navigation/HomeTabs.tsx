import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BrowseScreen } from '../features/browse/BrowseScreen'
import { BookingsScreen } from '../features/bookings/BookingsScreen'
import { SettingsScreen } from '../features/account/SettingsScreen'
import { FloatingTabBar } from '../components/FloatingTabBar'
import type { HomeTabParamList } from './types'

const Tab = createBottomTabNavigator<HomeTabParamList>()

export function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tab.Screen name="Home" component={BrowseScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}
