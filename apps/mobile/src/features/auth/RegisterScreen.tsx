import { useState } from 'react'
import { Text, View } from 'react-native'
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
      setError('Could not create account — the email may already be registered.')
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
        Create account
      </Text>
      <TextField label="Name" value={name} onChangeText={setName} />
      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Password (min 8 chars)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.sm }}>{error}</Text>
      )}
      <Button title={isLoading ? 'Creating…' : 'Create account'} onPress={submit} disabled={isLoading} />
      <Text
        onPress={onSwitch}
        style={{ color: theme.color.primary, marginTop: theme.spacing.md, textAlign: 'center' }}
      >
        Already have an account? Sign in
      </Text>
    </View>
  )
}
