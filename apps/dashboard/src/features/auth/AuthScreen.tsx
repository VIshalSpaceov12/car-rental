import { useState } from 'react'
import { useTheme } from '@car-rental/tokens'
import { LoginScreen } from './LoginScreen'
import { RegisterScreen } from './RegisterScreen'

export function AuthScreen() {
  const theme = useTheme()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: theme.color.surface,
        fontFamily: theme.typography.body.fontFamily,
      }}
    >
      <div
        style={{
          width: 360,
          maxWidth: '90vw',
          background: theme.color.background,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.card,
        }}
      >
        {mode === 'login' ? (
          <LoginScreen onSwitch={() => setMode('register')} />
        ) : (
          <RegisterScreen onSwitch={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}
