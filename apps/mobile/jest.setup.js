// Reanimated + gesture-handler need native runtimes that don't exist under jest.
// Wire up the libraries' own mocks so component trees that import them still render.

// Standard gesture-handler jest setup (mocks the native module + gesture objects).
require('react-native-gesture-handler/jestSetup')

// Reanimated ships a drop-in mock that no-ops worklets and animation drivers.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))
