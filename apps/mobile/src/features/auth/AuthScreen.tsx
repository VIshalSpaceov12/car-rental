import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Avatar } from '../../components/Avatar'
import { Card } from '../../components/Card'
import { LoginScreen } from './LoginScreen'
import { RegisterScreen } from './RegisterScreen'

export function AuthScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.xl,
          paddingBottom: insets.bottom + theme.spacing.xl,
          gap: theme.spacing.xl,
        }}
      >
        <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
          <Avatar name="C" size={theme.size.control.lg} />
          <Text
            style={{
              color: theme.color.text,
              fontSize: theme.typography.heading.fontSize,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            {t('auth.brandTitle')}
          </Text>
        </View>

        <Card padding={theme.spacing.lg}>
          {mode === 'login' ? (
            <LoginScreen onSwitch={() => setMode('register')} />
          ) : (
            <RegisterScreen onSwitch={() => setMode('login')} />
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
