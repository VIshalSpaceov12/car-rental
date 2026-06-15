import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { useBookingStatusSocket } from '../../realtime/useBookingStatusSocket'
import { Button } from '../../components/Button'
import { FleetPage } from '../fleet/FleetPage'
import { BranchesPage } from '../fleet/BranchesPage'
import { BookingsScreen } from '../bookings/BookingsScreen'

type Section = 'overview' | 'fleet' | 'branches' | 'bookings'

// One-off layout dimension (sidebar width); not a cross-component semantic size.
const SIDEBAR_WIDTH = 220

export function DashboardLayout() {
  const theme = useTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const branding = useAppSelector((s) => s.auth.branding)
  const [section, setSection] = useState<Section>('overview')

  // One authenticated Socket.io connection for the session; pushes live booking
  // status changes into the RTK Query board (invalidates the `Booking` tag).
  useBookingStatusSocket()

  const navItem = (key: Section, label: string) => (
    <a
      onClick={() => setSection(key)}
      style={{
        display: 'block',
        padding: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        cursor: 'pointer',
        color: section === key ? theme.color.onPrimary : theme.color.text,
        background: section === key ? theme.color.primary : 'transparent',
        marginBottom: theme.spacing.xs,
      }}
    >
      {label}
    </a>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: theme.typography.body.fontFamily }}>
      <aside style={{ width: SIDEBAR_WIDTH, background: theme.color.surface, padding: theme.spacing.md }}>
        <h2 style={{ color: theme.color.primary, marginTop: 0 }}>{branding?.name ?? 'Provider Dashboard'}</h2>
        {navItem('overview', t('nav.overview'))}
        {navItem('fleet', t('nav.fleet'))}
        {navItem('branches', t('nav.branches'))}
        {navItem('bookings', t('nav.bookings'))}
        <div style={{ marginTop: theme.spacing.lg }}>
          <Button onClick={() => dispatch(logout())}>{t('nav.logout')}</Button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: theme.spacing.xl, background: theme.color.background }}>
        {section === 'overview' && (
          <div>
            <h1 style={{ color: theme.color.primary, marginTop: 0 }}>{t('overview.title')}</h1>
            <p style={{ color: theme.color.text }}>
              {t('overview.welcome', { name: user?.name ?? '', role: user?.role ?? '' })}
            </p>
            <p style={{ color: theme.color.textMuted }}>{t('overview.tenant', { tenant: user?.providerId ?? '—' })}</p>
            <p style={{ color: theme.color.textMuted }}>{t('overview.intro')}</p>
          </div>
        )}
        {section === 'fleet' && <FleetPage />}
        {section === 'branches' && <BranchesPage />}
        {section === 'bookings' && <BookingsScreen />}
      </main>
    </div>
  )
}
