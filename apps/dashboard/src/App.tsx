import { useState } from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider, defaultTheme, useTheme } from '@car-rental/tokens'
import { store } from './store/store'
import { useAppSelector } from './store/hooks'
import { AuthScreen } from './features/auth/AuthScreen'
import { DashboardHome } from './features/dashboard/DashboardHome'
import { BookingsScreen } from './features/bookings/BookingsScreen'

type View = 'dashboard' | 'bookings'

function Root() {
  const theme = useTheme()
  const token = useAppSelector((s) => s.auth.token)
  const [view, setView] = useState<View>('dashboard')

  if (!token) return <AuthScreen />

  // Minimal in-app nav (Phase 3 integration seam — full navigation lands when
  // Phase 2's fleet screens merge). DashboardHome is left untouched.
  const tab = (key: View, label: string) => (
    <button
      onClick={() => setView(key)}
      style={{
        background: view === key ? theme.color.primary : 'transparent',
        color: view === key ? theme.color.onPrimary : theme.color.text,
        border: 'none',
        borderRadius: theme.radius.md,
        padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
        fontSize: theme.typography.body.fontSize,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <>
      <nav style={{ display: 'flex', gap: theme.spacing.sm, padding: theme.spacing.sm, background: theme.color.surface }}>
        {tab('dashboard', 'Dashboard')}
        {tab('bookings', 'Bookings')}
      </nav>
      {view === 'dashboard' ? <DashboardHome /> : <BookingsScreen />}
    </>
  )
}

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={defaultTheme}>
        <Root />
      </ThemeProvider>
    </Provider>
  )
}
