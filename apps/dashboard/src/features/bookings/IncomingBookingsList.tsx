import { useTheme } from '@car-rental/tokens'
import { BOOKING_TRANSITIONS, type BookingStatus, type BookingSummary } from '@car-rental/types'

export type ProviderBookingAction = 'accept' | 'reject' | 'prepare'

// Provider-driven actions, each mapped to the status it produces. A button shows
// only when that target is a legal next step per the authoritative graph — so the
// UI can never offer an illegal transition the API would reject.
const PROVIDER_ACTIONS: { action: ProviderBookingAction; target: BookingStatus; label: string }[] = [
  { action: 'accept', target: 'confirmed', label: 'Accept' },
  { action: 'reject', target: 'rejected', label: 'Reject' },
  { action: 'prepare', target: 'vehicle-prepared', label: 'Prepare' },
]

function availableActions(status: BookingStatus) {
  return PROVIDER_ACTIONS.filter((a) => BOOKING_TRANSITIONS[status].includes(a.target))
}

interface Props {
  bookings: BookingSummary[]
  onAction: (id: string, action: ProviderBookingAction) => void
  busyId: string | null
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString()

export function IncomingBookingsList({ bookings, onAction, busyId }: Props) {
  const theme = useTheme()

  if (bookings.length === 0) {
    return <p style={{ color: theme.color.textMuted }}>No incoming bookings yet.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {bookings.map((b) => {
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
              <div style={{ fontWeight: '600' }}>{b.vehicleName}</div>
              <div style={{ color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
                <span>{b.customerName}</span> · {fmtDate(b.startAt)} → {fmtDate(b.endAt)} · {b.plan}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <strong style={{ color: theme.color.text }}>
                {b.total} {b.currency}
              </strong>
              <span style={{ color: theme.color.textMuted }}>{b.status}</span>
              {actions.map((a) => (
                <button
                  key={a.action}
                  onClick={() => onAction(b.id, a.action)}
                  disabled={busy}
                  style={{
                    background: a.action === 'reject' ? theme.color.danger : theme.color.primary,
                    color: theme.color.onPrimary,
                    border: 'none',
                    borderRadius: theme.radius.md,
                    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                    fontSize: theme.typography.body.fontSize,
                    cursor: busy ? 'default' : 'pointer',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
