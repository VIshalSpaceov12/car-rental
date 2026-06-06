import { useState, type FormEvent } from 'react'
import { useTheme } from '@car-rental/tokens'
import { useRegisterMutation } from '../../store/authApi'
import { useAppDispatch } from '../../store/hooks'
import { setCredentials } from '../../store/authSlice'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

// The dashboard is the provider surface, so registration here creates a
// service-provider account (and its tenant) — customers register on mobile.
export function RegisterScreen({ onSwitch }: { onSwitch: () => void }) {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const [register, { isLoading }] = useRegisterMutation()
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await register({
        name,
        businessName,
        email,
        password,
        role: 'service-provider',
      }).unwrap()
      dispatch(setCredentials(res))
    } catch {
      setError('Could not create account — the email may already be registered.')
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>Create Provider Account</h1>
      <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
      <TextField
        label="Business name"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="e.g. Acme Rentals"
        required
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextField
        label="Password (min 8 chars)"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: theme.color.danger }}>{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating…' : 'Create account'}
      </Button>
      <p style={{ color: theme.color.textMuted, marginBottom: 0 }}>
        Already have an account?{' '}
        <a onClick={onSwitch} style={{ color: theme.color.primary, cursor: 'pointer' }}>
          Sign in
        </a>
      </p>
    </form>
  )
}
