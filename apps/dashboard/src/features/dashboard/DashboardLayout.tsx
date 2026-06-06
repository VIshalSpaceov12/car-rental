import { useState } from 'react'
import { useTheme } from '@car-rental/tokens'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { Button } from '../../components/Button'
import { FleetPage } from '../fleet/FleetPage'
import { BranchesPage } from '../fleet/BranchesPage'

type Section = 'overview' | 'fleet' | 'branches'

export function DashboardLayout() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [section, setSection] = useState<Section>('overview')

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
      <aside style={{ width: 220, background: theme.color.surface, padding: theme.spacing.md }}>
        <h2 style={{ color: theme.color.primary, marginTop: 0 }}>DemoRent</h2>
        {navItem('overview', 'Overview')}
        {navItem('fleet', 'Fleet')}
        {navItem('branches', 'Branches')}
        <div style={{ marginTop: theme.spacing.lg }}>
          <Button onClick={() => dispatch(logout())}>Log out</Button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: theme.spacing.xl, background: theme.color.background }}>
        {section === 'overview' && (
          <div>
            <h1 style={{ color: theme.color.primary, marginTop: 0 }}>Provider Dashboard</h1>
            <p style={{ color: theme.color.text }}>
              Welcome, <strong>{user?.name}</strong> ({user?.role})
            </p>
            <p style={{ color: theme.color.textMuted }}>Tenant: {user?.providerId ?? '—'}</p>
            <p style={{ color: theme.color.textMuted }}>Bookings inbox arrives in Phase 3.</p>
          </div>
        )}
        {section === 'fleet' && <FleetPage />}
        {section === 'branches' && <BranchesPage />}
      </main>
    </div>
  )
}
