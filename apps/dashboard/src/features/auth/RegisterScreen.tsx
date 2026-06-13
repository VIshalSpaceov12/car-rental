import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      setError(t('auth.createFailed'))
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>{t('auth.createAccountTitle')}</h1>
      <TextField label={t('auth.yourName')} value={name} onChange={(e) => setName(e.target.value)} required />
      <TextField
        label={t('auth.businessName')}
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder={t('auth.businessNamePlaceholder')}
        required
      />
      <TextField
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextField
        label={t('auth.passwordMin')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: theme.color.danger }}>{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('auth.creating') : t('auth.createAccount')}
      </Button>
      <p style={{ color: theme.color.textMuted, marginBottom: 0 }}>
        {t('auth.haveAccount')}{' '}
        <a onClick={onSwitch} style={{ color: theme.color.primary, cursor: 'pointer' }}>
          {t('auth.signInLink')}
        </a>
      </p>
    </form>
  )
}
