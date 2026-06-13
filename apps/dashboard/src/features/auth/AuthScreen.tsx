import { useState } from 'react'
import { useTheme } from '@car-rental/tokens'
import { LoginScreen } from './LoginScreen'
import { RegisterScreen } from './RegisterScreen'

// One-off auth-card width (no semantic size fits) — named const, not a token.
const CARD_WIDTH = 360

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
          width: CARD_WIDTH,
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
