import { useTheme } from '@car-rental/tokens'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { Button } from '../../components/Button'

// Placeholder authenticated area. Fleet management lands in Phase 2.
export function DashboardHome() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.color.background,
        fontFamily: theme.typography.body.fontFamily,
        padding: theme.spacing.xl,
      }}
    >
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>Provider Dashboard</h1>
      <p style={{ color: theme.color.text }}>
        Welcome, <strong>{user?.name}</strong> ({user?.role})
      </p>
      <p style={{ color: theme.color.textMuted }}>Tenant: {user?.providerId ?? '—'}</p>
      <p style={{ color: theme.color.textMuted }}>Fleet management arrives in Phase 2.</p>
      <div style={{ width: 160, marginTop: theme.spacing.lg }}>
        <Button onClick={() => dispatch(logout())}>Log out</Button>
      </div>
    </div>
  )
}
