import { Text, View } from 'react-native'
import { useTheme } from '@car-rental/tokens'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { clearAuth } from '../../storage/authStorage'
import { Button } from '../../components/Button'

// Placeholder authenticated screen. Fleet browsing lands in Phase 2.
export function HomeScreen() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const onLogout = async () => {
    await clearAuth()
    dispatch(logout())
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.color.background,
      }}
    >
      <Text
        style={{
          color: theme.color.primary,
          fontSize: theme.typography.heading.fontSize,
          fontWeight: theme.typography.heading.fontWeight,
        }}
      >
        Welcome, {user?.name}
      </Text>
      <Text
        style={{
          color: theme.color.textMuted,
          marginTop: theme.spacing.sm,
          marginBottom: theme.spacing.lg,
        }}
      >
        Browse the fleet — coming in Phase 2.
      </Text>
      <View style={{ width: 200 }}>
        <Button title="Log out" onPress={onLogout} />
      </View>
    </View>
  )
}
