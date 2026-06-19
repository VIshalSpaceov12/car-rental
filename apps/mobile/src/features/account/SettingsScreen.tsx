import { useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { Locale } from '@car-rental/types'
import { Button } from '../../components/Button'
import { Avatar } from '../../components/Avatar'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { clearAuth } from '../../storage/authStorage'
import { useBrandingQuery } from '../../store/authApi'
import { setLocale } from '../../i18n'

/** Settings tab — account summary, language switcher (EN/AR + RTL), logout. */
export function SettingsScreen() {
  const theme = useTheme()
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  // Shares the RTK Query cache with App's <Branded>: refetching here re-themes
  // the whole app, demonstrating the white-label update flowing through.
  const { refetch, isFetching } = useBrandingQuery()
  const [switching, setSwitching] = useState(false)

  const onLogout = async () => {
    await clearAuth()
    dispatch(logout())
  }

  const onSelectLocale = async (locale: Locale) => {
    if (locale === i18n.language || switching) return
    setSwitching(true)
    try {
      // Strings update immediately; RTL flips only take effect after a reload,
      // so prompt for a restart when the layout direction actually changed.
      const { directionChanged } = await setLocale(locale)
      if (directionChanged) {
        Alert.alert(t('settings.restartTitle'), t('settings.restartBody'))
      }
    } finally {
      setSwitching(false)
    }
  }

  const locales: Locale[] = ['en', 'ar']
  const localeLabel: Record<Locale, string> = {
    en: t('settings.languageEnglish'),
    ar: t('settings.languageArabic'),
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      {/* Pinned title — stays put while the settings content scrolls. */}
      <View style={{ paddingTop: insets.top + theme.spacing.lg, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
        <Text style={{ color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight }}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => void refetch()}
            tintColor={theme.color.primary}
          />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Avatar name={user?.name} />
        <View>
          <Text style={{ color: theme.color.text, fontSize: theme.typography.subtitle.fontSize, fontWeight: '600' }}>
            {user?.name ?? t('settings.guest')}
          </Text>
          <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{user?.email}</Text>
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, fontWeight: '600' }}>
          {t('settings.language')}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.sm,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.xs,
          }}
        >
          {locales.map((locale) => {
            const active = i18n.language === locale
            return (
              <Pressable
                key={locale}
                onPress={() => void onSelectLocale(locale)}
                disabled={switching}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.color.primary : theme.color.surface,
                }}
              >
                <Text
                  style={{
                    color: active ? theme.color.onPrimary : theme.color.text,
                    fontSize: theme.typography.body.fontSize,
                    fontWeight: '600',
                  }}
                >
                  {localeLabel[locale]}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Text style={{ color: theme.color.textSubtle, fontSize: theme.typography.caption.fontSize }}>
          {t('settings.refreshBranding')}
        </Text>
      </View>

        <Button title={t('auth.logout')} onPress={onLogout} />
      </ScrollView>
    </View>
  )
}
