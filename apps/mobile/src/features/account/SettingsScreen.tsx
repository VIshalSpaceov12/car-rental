import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Button } from '../../components/Button'
import { Avatar } from '../../components/Avatar'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { clearAuth } from '../../storage/authStorage'

/** Settings tab — account summary + logout. */
export function SettingsScreen() {
  const theme = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
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
        backgroundColor: theme.color.background,
        paddingTop: insets.top + theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}
    >
      <Text style={{ color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight }}>
        {t('settings.title')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Avatar name={user?.name} />
        <View>
          <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '600' }}>
            {user?.name ?? t('settings.guest')}
          </Text>
          <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{user?.email}</Text>
        </View>
      </View>
      <Button title={t('auth.logout')} onPress={onLogout} />
    </View>
  )
}
