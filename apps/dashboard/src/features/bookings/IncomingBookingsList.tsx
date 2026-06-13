import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import {
  BOOKING_TRANSITIONS,
  type BookingStatus,
  type BookingSummary,
  type PaymentStatus,
} from '@car-rental/types'

export type ProviderBookingAction = 'reject' | 'prepare' | 'cancel'

// Provider-driven actions, each mapped to the status it produces. A button shows
// only when that target is a legal next step per the authoritative graph — so the
// UI can never offer an illegal transition the API would reject. Note: the
// provider no longer confirms/accepts — reserved → confirmed is driven by the
// customer's payment, so there is no action targeting `confirmed`.
const PROVIDER_ACTIONS: { action: ProviderBookingAction; target: BookingStatus }[] = [
  { action: 'reject', target: 'rejected' },
  { action: 'prepare', target: 'vehicle-prepared' },
  { action: 'cancel', target: 'cancelled' },
]

// The default "Incoming" view shows only bookings the provider can still act on;
// terminal/historical statuses (picked-up → completed, rejected, cancelled) are
// hidden unless the filter is switched to "All".
const ACTIONABLE_STATUSES: BookingStatus[] = ['reserved', 'confirmed', 'vehicle-prepared']

type StatusFilter = 'incoming' | 'all'

function availableActions(status: BookingStatus) {
  return PROVIDER_ACTIONS.filter((a) => BOOKING_TRANSITIONS[status].includes(a.target))
}

const ACTION_LABEL_KEY: Record<ProviderBookingAction, 'bookings.reject' | 'bookings.prepare' | 'bookings.cancel'> = {
  reject: 'bookings.reject',
  prepare: 'bookings.prepare',
  cancel: 'bookings.cancel',
}

// Read-only payment status chip labels. Null (no payment recorded yet) renders a dash.
const PAYMENT_STATUS_LABEL_KEY: Record<
  PaymentStatus,
  'bookings.payment.paid' | 'bookings.payment.pending' | 'bookings.payment.failed' | 'bookings.payment.refunded'
> = {
  paid: 'bookings.payment.paid',
  pending: 'bookings.payment.pending',
  failed: 'bookings.payment.failed',
  refunded: 'bookings.payment.refunded',
}

interface Props {
  bookings: BookingSummary[]
  onAction: (id: string, action: ProviderBookingAction, prepReadyAt?: string) => void
  busyId: string | null
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString()
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString()

export function IncomingBookingsList({ bookings, onAction, busyId }: Props) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [filter, setFilter] = useState<StatusFilter>('incoming')
  // Per-booking prep-ready datetime (datetime-local value) before the Prepare call.
  const [prepReadyAt, setPrepReadyAt] = useState<Record<string, string>>({})

  const visible =
    filter === 'incoming' ? bookings.filter((b) => ACTIONABLE_STATUSES.includes(b.status)) : bookings

  // Read-only payment chip: color by status, dash for none recorded yet.
  const paymentChipColor = (status: PaymentStatus | null) => {
    switch (status) {
      case 'paid':
        return theme.color.success
      case 'failed':
        return theme.color.danger
      default:
        return theme.color.textMuted
    }
  }
  const renderPaymentChip = (status: PaymentStatus | null) => (
    <span
      style={{
        color: paymentChipColor(status),
        border: `1px solid ${paymentChipColor(status)}`,
        borderRadius: theme.radius.sm,
        padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
        fontSize: theme.typography.caption.fontSize,
      }}
    >
      {status ? t(PAYMENT_STATUS_LABEL_KEY[status]) : '—'}
    </span>
  )

  const filterControl = (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        color: theme.color.textMuted,
      }}
    >
      {t('bookings.filterLabel')}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as StatusFilter)}
        style={{
          padding: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.color.border}`,
        }}
      >
        <option value="incoming">{t('bookings.filterIncoming')}</option>
        <option value="all">{t('bookings.filterAll')}</option>
      </select>
    </label>
  )

  if (visible.length === 0) {
    return (
      <div>
        {filterControl}
        <p style={{ color: theme.color.textMuted }}>{t('bookings.empty')}</p>
      </div>
    )
  }

  return (
    <div>
      {filterControl}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {visible.map((b) => {
          const actions = availableActions(b.status)
          const busy = busyId === b.id
          return (
            <div
              key={b.id}
              style={{
                background: theme.color.surface,
                borderRadius: theme.radius.card,
                padding: theme.spacing.md,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.spacing.md,
              }}
            >
              <div style={{ color: theme.color.text }}>
                <div style={{ fontWeight: theme.typography.label.fontWeight }}>{b.vehicleName}</div>
                <div style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
                  <span>{b.customerName}</span> · {fmtDate(b.startAt)} → {fmtDate(b.endAt)} · {b.plan}
                </div>
                {b.status === 'vehicle-prepared' && b.prepReadyAt && (
                  <div style={{ color: theme.color.success, fontSize: theme.typography.caption.fontSize }}>
                    {t('bookings.prepReadyAt', { when: fmtDateTime(b.prepReadyAt) })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.md }}>
                <strong style={{ color: theme.color.text }}>
                  {b.total} {b.currency}
                </strong>
                <span style={{ color: theme.color.textMuted }}>{b.status}</span>
                {renderPaymentChip(b.paymentStatus)}
                {actions.map((a) => (
                  <div key={a.action} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    {a.action === 'prepare' && (
                      <label
                        style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, color: theme.color.textMuted }}
                      >
                        {t('bookings.prepReadyLabel')}
                        <input
                          type="datetime-local"
                          value={prepReadyAt[b.id] ?? ''}
                          onChange={(e) =>
                            setPrepReadyAt((prev) => ({ ...prev, [b.id]: e.target.value }))
                          }
                          style={{
                            padding: theme.spacing.xs,
                            borderRadius: theme.radius.sm,
                            border: `1px solid ${theme.color.border}`,
                          }}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => {
                        const draft = prepReadyAt[b.id]
                        if (a.action === 'prepare' && draft) {
                          onAction(b.id, a.action, new Date(draft).toISOString())
                        } else {
                          onAction(b.id, a.action)
                        }
                      }}
                      disabled={busy}
                      style={{
                        background:
                          a.action === 'reject' || a.action === 'cancel' ? theme.color.danger : theme.color.primary,
                        color: theme.color.onPrimary,
                        border: 'none',
                        borderRadius: theme.radius.md,
                        padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                        fontSize: theme.typography.body.fontSize,
                        cursor: busy ? 'default' : 'pointer',
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {t(ACTION_LABEL_KEY[a.action])}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
