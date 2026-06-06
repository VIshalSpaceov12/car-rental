import { useState } from 'react'
import { View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { LoginScreen } from './LoginScreen'
import { RegisterScreen } from './RegisterScreen'

export function AuthScreen() {
  const theme = useTheme()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.color.background,
      }}
    >
      {mode === 'login' ? (
        <LoginScreen onSwitch={() => setMode('register')} />
      ) : (
        <RegisterScreen onSwitch={() => setMode('login')} />
      )}
    </View>
  )
}
