import { useState, type FormEvent } from 'react'
import { useTheme } from '@car-rental/tokens'
import { useLoginMutation } from '../../store/authApi'
import { useAppDispatch } from '../../store/hooks'
import { setCredentials } from '../../store/authSlice'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

export function LoginScreen({ onSwitch }: { onSwitch: () => void }) {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  // Prefilled with the seeded provider for quick demoing.
  const [email, setEmail] = useState('provider@demo.test')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await login({ email, password }).unwrap()
      dispatch(setCredentials(res))
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>Provider Sign In</h1>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: theme.color.danger }}>{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </Button>
      <p style={{ color: theme.color.textMuted, marginBottom: 0 }}>
        New provider?{' '}
        <a onClick={onSwitch} style={{ color: theme.color.primary, cursor: 'pointer' }}>
          Create an account
        </a>
      </p>
    </form>
  )
}
