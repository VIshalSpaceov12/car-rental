import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { useLoginMutation } from '../../store/authApi'
import { useAppDispatch } from '../../store/hooks'
import { setCredentials } from '../../store/authSlice'
import { saveAuth } from '../../storage/authStorage'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

export function LoginScreen({ onSwitch }: { onSwitch: () => void }) {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  // Prefilled with the seeded customer for quick demoing.
  const [email, setEmail] = useState('customer@demo.test')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    try {
      const res = await login({ email, password }).unwrap()
      await saveAuth(res)
      dispatch(setCredentials(res))
    } catch {
      setError('Invalid email or password')
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
        Sign in
      </Text>
      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error && (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.sm }}>{error}</Text>
      )}
      <Button title={isLoading ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={isLoading} />
      <Text
        onPress={onSwitch}
        style={{ color: theme.color.primary, marginTop: theme.spacing.md, textAlign: 'center' }}
      >
        New here? Create an account
      </Text>
    </View>
  )
}
