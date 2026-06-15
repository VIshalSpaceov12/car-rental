import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type {
  BookingStatus,
  Contract,
  OtpIssueResponse,
  OtpStatus,
  OtpSummary,
  ReturnCondition,
  ReturnInspection,
} from '@car-rental/types'

const RETURN_CONDITIONS: ReturnCondition[] = ['clean', 'minor-damage', 'major-damage']

const CONDITION_LABEL_KEY: Record<
  ReturnCondition,
  'bookings.phase5.condition.clean' | 'bookings.phase5.condition.minorDamage' | 'bookings.phase5.condition.majorDamage'
> = {
  clean: 'bookings.phase5.condition.clean',
  'minor-damage': 'bookings.phase5.condition.minorDamage',
  'major-damage': 'bookings.phase5.condition.majorDamage',
}

const OTP_STATUS_LABEL_KEY: Record<
  OtpStatus,
  'bookings.phase5.otpStatus.issued' | 'bookings.phase5.otpStatus.consumed' | 'bookings.phase5.otpStatus.expired'
> = {
  issued: 'bookings.phase5.otpStatus.issued',
  consumed: 'bookings.phase5.otpStatus.consumed',
  expired: 'bookings.phase5.otpStatus.expired',
}

/**
 * Phase-5 provider actions for a single booking, gated by status. Fully
 * prop-driven (data + handlers injected) so it renders without the store and is
 * unit-testable; the container wires the RTK Query hooks per booking.
 */
export interface BookingPhase5ActionsProps {
  status: BookingStatus
  busy: boolean
  /** OTP plaintext returned once at issuance, held in container state. */
  issuedOtp: OtpIssueResponse | null
  /** Lifecycle of the issued OTP (issued/consumed/expired), or null if none/404. */
  otpSummary: OtpSummary | null
  /** Loaded only after the provider requests the contract. */
  contract: Contract | null
  /** Recorded inspection for a completed booking, or null if not loaded yet. */
  inspection: ReturnInspection | null
  onIssueOtp: () => void
  onViewContract: () => void
  onComplete: (condition: ReturnCondition, notes: string) => void
}

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString()

export function BookingPhase5Actions({
  status,
  busy,
  issuedOtp,
  otpSummary,
  contract,
  inspection,
  onIssueOtp,
  onViewContract,
  onComplete,
}: BookingPhase5ActionsProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [condition, setCondition] = useState<ReturnCondition>('clean')
  const [notes, setNotes] = useState('')
  const [showContract, setShowContract] = useState(false)

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.sm,
    marginBlockStart: theme.spacing.sm,
    paddingBlockStart: theme.spacing.sm,
    borderBlockStart: `1px solid ${theme.color.border}`,
    width: '100%',
  }

  const primaryButtonStyle = {
    background: busy ? theme.color.textMuted : theme.color.primary,
    color: theme.color.onPrimary,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    fontSize: theme.typography.body.fontSize,
    cursor: busy ? 'default' : 'pointer',
  }

  if (status === 'vehicle-prepared') {
    return (
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <button onClick={onIssueOtp} disabled={busy} style={primaryButtonStyle}>
            {t('bookings.phase5.issueOtp')}
          </button>
          <button
            onClick={() => {
              onViewContract()
              setShowContract((s) => !s)
            }}
            disabled={busy}
            style={{
              ...primaryButtonStyle,
              background: 'transparent',
              color: theme.color.primary,
              border: `1px solid ${theme.color.primary}`,
            }}
          >
            {t('bookings.phase5.viewContract')}
          </button>
        </div>

        {issuedOtp && (
          <div
            style={{
              background: theme.color.surfaceAlt,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
            }}
          >
            <div style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
              {t('bookings.phase5.otpCodeLabel')}
            </div>
            <div
              style={{
                color: theme.color.primary,
                fontSize: theme.typography.display.fontSize,
                fontWeight: theme.typography.display.fontWeight,
                letterSpacing: theme.spacing.sm,
              }}
            >
              {issuedOtp.otp}
            </div>
            <div style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
              {t('bookings.phase5.otpExpiresAt', { when: fmtDateTime(issuedOtp.expiresAt) })}
            </div>
          </div>
        )}

        {otpSummary && (
          <div style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
            {t('bookings.phase5.otpTrackingStatus', { status: t(OTP_STATUS_LABEL_KEY[otpSummary.status]) })}
          </div>
        )}

        {showContract && contract && (
          <div
            style={{
              background: theme.color.surfaceAlt,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
            }}
          >
            <div style={{ color: theme.color.text, fontWeight: theme.typography.label.fontWeight }}>
              {t('bookings.phase5.contractTitle')}
            </div>
            <p
              style={{
                color: theme.color.textMuted,
                fontSize: theme.typography.body.fontSize,
                whiteSpace: 'pre-wrap',
                marginBlock: theme.spacing.sm,
              }}
            >
              {contract.content}
            </p>
            <div style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
              {contract.signedAt
                ? t('bookings.phase5.contractSigned', {
                    name: contract.signerName ?? '',
                    when: fmtDateTime(contract.signedAt),
                  })
                : t('bookings.phase5.contractUnsigned')}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (status === 'returned') {
    return (
      <form
        style={sectionStyle}
        onSubmit={(e) => {
          e.preventDefault()
          onComplete(condition, notes.trim())
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, color: theme.color.textMuted }}>
          {t('bookings.phase5.conditionLabel')}
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as ReturnCondition)}
            style={{
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.color.border}`,
            }}
          >
            {RETURN_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {t(CONDITION_LABEL_KEY[c])}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, color: theme.color.textMuted }}>
          {t('bookings.phase5.notesLabel')}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.color.border}`,
              fontSize: theme.typography.body.fontSize,
              resize: 'vertical',
            }}
          />
        </label>
        <button type="submit" disabled={busy} style={primaryButtonStyle}>
          {t('bookings.phase5.completeInspect')}
        </button>
      </form>
    )
  }

  if (status === 'completed' && inspection) {
    return (
      <div style={sectionStyle}>
        <div style={{ color: theme.color.text, fontWeight: theme.typography.label.fontWeight }}>
          {t('bookings.phase5.inspectionTitle')}
        </div>
        <div style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
          {t('bookings.phase5.inspectionCondition', { condition: t(CONDITION_LABEL_KEY[inspection.condition]) })}
        </div>
        {inspection.notes && (
          <div style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
            {t('bookings.phase5.inspectionNotes', { notes: inspection.notes })}
          </div>
        )}
      </div>
    )
  }

  return null
}
