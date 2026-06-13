import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import {
  useBranchesQuery,
  useCreateBranchMutation,
  useDeleteBranchMutation,
} from '../../store/fleetApi'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

// One-off form width (no semantic size fits) — named const, not a token.
const FORM_MAX_WIDTH = 420

export function BranchesPage() {
  const theme = useTheme()
  const { t } = useTranslation()
  const { data: branches = [] } = useBranchesQuery()
  const [createBranch, { isLoading }] = useCreateBranchMutation()
  const [deleteBranch] = useDeleteBranchMutation()
  const [form, setForm] = useState({ name: '', address: '', lat: '25.2048', lng: '55.2708', hours: '08:00-20:00' })

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await createBranch({
      name: form.name.trim(),
      address: form.address,
      lat: Number(form.lat),
      lng: Number(form.lng),
      hours: form.hours,
    })
    setForm({ ...form, name: '', address: '' })
  }

  return (
    <div>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>{t('branches.title')}</h1>
      <ul style={{ color: theme.color.text }}>
        {branches.map((b) => (
          <li key={b.id} style={{ marginBottom: theme.spacing.xs }}>
            <strong>{b.name}</strong> — {b.address} ({b.hours}){' '}
            <a onClick={() => deleteBranch(b.id)} style={{ color: theme.color.danger, cursor: 'pointer' }}>
              {t('common.remove')}
            </a>
          </li>
        ))}
        {branches.length === 0 && <li style={{ color: theme.color.textMuted }}>{t('branches.noBranches')}</li>}
      </ul>

      <h2 style={{ color: theme.color.text }}>{t('branches.addBranch')}</h2>
      <form onSubmit={add} style={{ maxWidth: FORM_MAX_WIDTH }}>
        <TextField label={t('branches.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField
          label={t('branches.address')}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <TextField label={t('branches.hours')} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('branches.adding') : t('branches.addBranch')}
        </Button>
      </form>
    </div>
  )
}
