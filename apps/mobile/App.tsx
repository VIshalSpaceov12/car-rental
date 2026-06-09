import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Provider } from 'react-redux'
import { ThemeProvider, useTheme, defaultTheme } from '@car-rental/tokens'
import { store } from './src/store/store'
import { useAppDispatch, useAppSelector } from './src/store/hooks'
import { hydrate } from './src/store/authSlice'
import { loadAuth } from './src/storage/authStorage'
import { AuthScreen } from './src/features/auth/AuthScreen'
import { HomeScreen } from './src/features/home/HomeScreen'
import { BookingFlow } from './src/features/booking/BookingFlow'

function Root() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { token, hydrated } = useAppSelector((s) => s.auth)
  const [booking, setBooking] = useState(false)

  // Restore a persisted session on launch before deciding which screen to show.
  useEffect(() => {
    loadAuth().then((auth) => dispatch(hydrate(auth)))
  }, [dispatch])

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.color.background }}>
        <ActivityIndicator color={theme.color.primary} />
      </View>
    )
  }

  if (!token) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="auto" />
      </>
    )
  }

  // Phase 3 integration seam: a floating launcher opens the self-contained
  // booking flow over HomeScreen (untouched). Detail→booking nav wires in when
  // Phase 2's fleet browse merges.
  return (
    <View style={{ flex: 1 }}>
      {booking ? (
        <BookingFlow onClose={() => setBooking(false)} />
      ) : (
        <>
          <HomeScreen />
          <Pressable
            onPress={() => setBooking(true)}
            style={{
              position: 'absolute',
              right: theme.spacing.lg,
              bottom: theme.spacing.xl,
              backgroundColor: theme.color.primary,
              borderRadius: theme.radius.card,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <Text style={{ color: theme.color.onPrimary, fontSize: theme.typography.body.fontSize }}>Book a car</Text>
          </Pressable>
        </>
      )}
      <StatusBar style="auto" />
    </View>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={defaultTheme}>
        <Root />
      </ThemeProvider>
    </Provider>
  )
}
