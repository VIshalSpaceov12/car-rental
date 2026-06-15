import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Button } from '../../components/Button'
import { useReturnVehicleMutation } from '../../store/bookingApi'

/**
 * Vehicle return for a `picked-up` booking. The customer initiates the return
 * (`picked-up → returned`); the provider later inspects and completes it.
 */
export function ReturnScreen({
  bookingId,
  onClose,
}: {
  bookingId: string
  onClose: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()

  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returnVehicle, returning] = useReturnVehicleMutation()

  const onReturn = async () => {
    setError(null)
    try {
      await returnVehicle(bookingId).unwrap()
      setDone(true)
    } catch {
      setError(t('return.error'))
    }
  }

  const heading = { fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <Text style={{ color: theme.color.primary, ...heading }}>{t('return.title')}</Text>
        {!done && (
          <Pressable onPress={onClose}>
            <Text style={{ color: theme.color.textMuted }}>{t('common.cancel')}</Text>
          </Pressable>
        )}
      </View>

      {error ? <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.md }}>{error}</Text> : null}

      {!done ? (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.lg }}>{t('return.intro')}</Text>
          <Button
            title={returning.isLoading ? t('return.returning') : t('return.confirm')}
            onPress={onReturn}
            disabled={returning.isLoading}
          />
        </View>
      ) : (
        <View>
          <Text style={{ color: theme.color.success, ...heading, marginBottom: theme.spacing.sm }}>
            {t('return.doneTitle')}
          </Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.lg }}>{t('return.doneBody')}</Text>
          <Button title={t('common.done')} onPress={onClose} />
        </View>
      )}
    </ScrollView>
  )
}
