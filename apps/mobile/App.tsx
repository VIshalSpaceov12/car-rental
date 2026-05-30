import { StatusBar } from 'expo-status-bar'
import { Text, View } from 'react-native'
import { ThemeProvider, useTheme, defaultTheme } from '@car-rental/tokens'

function Home() {
  const theme = useTheme()
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.color.background,
        padding: theme.spacing.lg,
      }}
    >
      <Text
        style={{
          color: theme.color.primary,
          fontSize: theme.typography.heading.fontSize,
          fontWeight: theme.typography.heading.fontWeight,
        }}
      >
        Car Rental — mobile
      </Text>
      <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing.sm }}>
        Skeleton booting via @car-rental/tokens
      </Text>
      <StatusBar style="auto" />
    </View>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <Home />
    </ThemeProvider>
  )
}
