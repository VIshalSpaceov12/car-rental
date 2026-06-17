import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { UnlockButton } from '../../components/UnlockButton'
import { useToast } from '../../components/Toast'
import {
  useGetContractQuery,
  useSignContractMutation,
  useVerifyOtpMutation,
} from '../../store/bookingApi'

const OTP_LENGTH = 6

type Step = 'otp' | 'contract' | 'done'

/**
 * Keyless pickup for a `vehicle-prepared` booking:
 *   1. customer enters the 6-digit OTP they received out-of-band → verify
 *   2. customer reads + signs the digital contract → sign (moves booking to picked-up)
 *
 * Mirrors BookingFlow's step machine and `.unwrap()` try/catch error handling.
 */
export function PickupFlow({
  bookingId,
  vehicleId,
  onClose,
}: {
  bookingId: string
  vehicleId: string
  onClose: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const toast = useToast()

  const [step, setStep] = useState<Step>('otp')
  const [otp, setOtp] = useState('')
  const [signerName, setSignerName] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [verifyOtp, verifying] = useVerifyOtpMutation()
  const [signContract, signing] = useSignContractMutation()
  // The contract is fetched only once we reach the contract step.
  const contract = useGetContractQuery(bookingId, { skip: step !== 'contract' })

  // Fired after the UnlockButton's lock→unlock animation completes. Verifies the
  // OTP; a valid code advances to the contract + a success toast, otherwise we
  // surface the error via toast (and inline) so the user can retry.
  const onVerify = async () => {
    setError(null)
    try {
      const { valid } = await verifyOtp({ bookingId, vehicleId, otp: otp.trim() }).unwrap()
      if (!valid) {
        setError(t('pickup.otpInvalid'))
        toast.show({ message: t('pickup.otpInvalid'), variant: 'error' })
        return
      }
      toast.show({ message: t('pickup.unlocked'), variant: 'success' })
      setStep('contract')
    } catch {
      setError(t('pickup.otpError'))
      toast.show({ message: t('pickup.otpError'), variant: 'error' })
    }
  }

  const onSign = async () => {
    setError(null)
    try {
      await signContract({ bookingId, body: { signerName: signerName.trim(), consent } }).unwrap()
      setStep('done')
    } catch {
      setError(t('pickup.signError'))
      toast.show({ message: t('pickup.signError'), variant: 'error' })
    }
  }

  const heading = { fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight }
  const canSign = consent && signerName.trim().length > 0 && !signing.isLoading

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <Text style={{ color: theme.color.primary, ...heading }}>{t('pickup.title')}</Text>
        {step !== 'done' && (
          <Pressable onPress={onClose}>
            <Text style={{ color: theme.color.textMuted }}>{t('common.cancel')}</Text>
          </Pressable>
        )}
      </View>

      {error ? <Text style={{ color: theme.color.danger, marginBottom: theme.spacing.md }}>{error}</Text> : null}

      {step === 'otp' && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>{t('pickup.otpIntro')}</Text>
          <TextField
            label={t('pickup.otpLabel')}
            value={otp}
            onChangeText={(text) => {
              // Digits only, capped at the expected length.
              setOtp(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))
              setError(null)
            }}
            placeholder="000000"
            keyboardType="number-pad"
            autoCapitalize="none"
            maxLength={OTP_LENGTH}
          />
          <View style={{ alignItems: 'center', marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            <UnlockButton
              accessibilityLabel={t('pickup.verify')}
              disabled={otp.length !== OTP_LENGTH || verifying.isLoading}
              onUnlocked={() => void onVerify()}
            />
            <Text style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
              {verifying.isLoading ? t('pickup.verifying') : t('pickup.unlockHint')}
            </Text>
          </View>
        </View>
      )}

      {step === 'contract' && (
        <View>
          <Text style={{ color: theme.color.text, marginBottom: theme.spacing.sm }}>{t('pickup.contractTitle')}</Text>

          {contract.isLoading && <ActivityIndicator color={theme.color.primary} />}
          {contract.isError && <Text style={{ color: theme.color.danger }}>{t('pickup.contractError')}</Text>}

          {contract.data && (
            <View>
              <View
                style={{
                  backgroundColor: theme.color.surface,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                <Text style={{ color: theme.color.text, fontSize: theme.typography.body.fontSize }}>
                  {contract.data.content}
                </Text>
              </View>

              <TextField
                label={t('pickup.signerNameLabel')}
                value={signerName}
                onChangeText={(text) => {
                  setSignerName(text)
                  setError(null)
                }}
                placeholder={t('pickup.signerNamePlaceholder')}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                <Text style={{ color: theme.color.text, flex: 1 }}>{t('pickup.consentLabel')}</Text>
                <Switch
                  value={consent}
                  onValueChange={(v) => {
                    setConsent(v)
                    setError(null)
                  }}
                  trackColor={{ true: theme.color.primary, false: theme.color.surfaceAlt }}
                />
              </View>

              <Button
                title={signing.isLoading ? t('pickup.signing') : t('pickup.sign')}
                onPress={onSign}
                disabled={!canSign}
              />
            </View>
          )}
        </View>
      )}

      {step === 'done' && (
        <View>
          <Text style={{ color: theme.color.success, ...heading, marginBottom: theme.spacing.sm }}>
            {t('pickup.doneTitle')}
          </Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.lg }}>
            {t('pickup.doneBody')}
          </Text>
          <Button title={t('common.done')} onPress={onClose} />
        </View>
      )}
    </ScrollView>
  )
}
