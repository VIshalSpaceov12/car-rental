import { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Text, View } from 'react-native'
import { ThemeProvider, useTheme, defaultTheme } from '@car-rental/tokens'
import { API_URL } from './src/api'

type ApiState = { status: 'loading' | 'ok' | 'error'; detail: string }

function Home() {
  const theme = useTheme()
  const [api, setApi] = useState<ApiState>({ status: 'loading', detail: API_URL })

  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((body: { service: string; status: string }) => {
        if (!cancelled) setApi({ status: 'ok', detail: `${body.service} · ${body.status}` })
      })
      .catch((err: unknown) => {
        if (!cancelled) setApi({ status: 'error', detail: err instanceof Error ? err.message : String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const apiColor =
    api.status === 'ok'
      ? theme.color.success
      : api.status === 'error'
        ? theme.color.danger
        : theme.color.textMuted

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
      <Text style={{ color: apiColor, marginTop: theme.spacing.md }}>
        API: {api.status} — {api.detail}
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
