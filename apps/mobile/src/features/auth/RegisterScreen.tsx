import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { useRegisterMutation } from '../../store/authApi'
import { useAppDispatch } from '../../store/hooks'
import { setCredentials } from '../../store/authSlice'
import { saveAuth } from '../../storage/authStorage'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

// The mobile app is the customer surface, so registration here creates a customer.
export function RegisterScreen({ onSwitch }: { onSwitch: () => void }) {
  const theme = useTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [register, { isLoading }] = useRegisterMutation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    try {
      const res = await register({ name, email, password, role: 'customer' }).unwrap()
      await saveAuth(res)
      dispatch(setCredentials(res))
    } catch {
      setError(t('auth.registerError'))
    }
  }

  return (
    <View>
      <Text
        style={{
          color: theme.color.primary,
          fontSize: theme.typography.heading.fontSize,
          fontWeight: theme.typography.heading.fontWeight,
          marginBottom: theme.spacing.lg,
        }}
      >
        {t('auth.registerTitle')}
      </Text>
      <TextField label={t('auth.name')} value={name} onChangeText={setName} />
      <TextField
        label={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label={t('auth.passwordHint')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.sm }}>{error}</Text>
      )}
      <Button title={isLoading ? t('auth.registering') : t('auth.registerAction')} onPress={submit} disabled={isLoading} />
      <Text
        onPress={onSwitch}
        style={{ color: theme.color.primary, marginTop: theme.spacing.md, textAlign: 'center' }}
      >
        {t('auth.switchToLogin')}
      </Text>
    </View>
  )
}
