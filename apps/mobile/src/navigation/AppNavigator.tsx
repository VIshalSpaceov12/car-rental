import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { BrowseScreen } from '../features/browse/BrowseScreen'
import { VehicleDetailScreen } from '../features/browse/VehicleDetailScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse cars' }} />
        <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
