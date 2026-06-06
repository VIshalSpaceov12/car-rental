import { Provider } from 'react-redux'
import { ThemeProvider, defaultTheme } from '@car-rental/tokens'
import { store } from './store/store'
import { useAppSelector } from './store/hooks'
import { AuthScreen } from './features/auth/AuthScreen'
import { DashboardLayout } from './features/dashboard/DashboardLayout'

function Root() {
  const token = useAppSelector((s) => s.auth.token)
  return token ? <DashboardLayout /> : <AuthScreen />
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
