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
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedList, AnimatedRow } from '../../components/AnimatedRow'
import { useToast } from '../../components/Toast'

// One-off form width (no semantic size fits) — named const, not a token.
const FORM_MAX_WIDTH = 560

export function BranchesPage() {
  const theme = useTheme()
  const { t } = useTranslation()
  const toast = useToast()
  const { data: branches = [], isLoading: branchesLoading } = useBranchesQuery()
  const [createBranch, { isLoading }] = useCreateBranchMutation()
  const [deleteBranch] = useDeleteBranchMutation()
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '', hours: '08:00-20:00' })
  const [error, setError] = useState<string | null>(null)

  const add = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return
    const lat = Number(form.lat)
    const lng = Number(form.lng)
    // Coordinates are required and must parse — branches drive the Maps locator, so
    // a blank/NaN coordinate can't be allowed to fall back to a default location.
    if (!form.lat.trim() || !form.lng.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError(t('branches.invalidCoords'))
      return
    }
    try {
      await createBranch({ name: form.name.trim(), address: form.address, lat, lng, hours: form.hours }).unwrap()
      setForm({ name: '', address: '', lat: '', lng: '', hours: form.hours })
      toast.show(t('toast.saved'), 'success')
    } catch {
      setError(t('branches.actionFailed'))
      toast.show(t('toast.saveFailed'), 'error')
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await deleteBranch(id).unwrap()
      toast.show(t('toast.deleted'), 'success')
    } catch {
      toast.show(t('toast.deleteFailed'), 'error')
    }
  }

  const hoverCss = `
    .cr-act { border: none; background: transparent; cursor: pointer; border-radius: ${theme.radius.pill}px;
      padding: 4px 10px; font-size: ${theme.typography.caption.fontSize}px; font-weight: ${theme.typography.label.fontWeight};
      transition: background-color 140ms ease; }
    .cr-act:hover { background-color: ${theme.color.surfaceAlt}; }
  `

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <style>{hoverCss}</style>

      <div>
        <h1 style={{ margin: 0, color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.display.fontWeight, letterSpacing: -0.5 }}>
          {t('branches.title')}
        </h1>
        <p style={{ margin: `${theme.spacing.xs}px 0 0`, color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
          {t('branches.subtitle')}
        </p>
      </div>

      <Panel>
        {branchesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={theme.spacing.lg} />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <p style={{ margin: 0, color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>{t('branches.noBranches')}</p>
        ) : (
          <AnimatedList>
            {branches.map((b, i) => (
              <AnimatedRow
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                  paddingBlock: theme.spacing.md,
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.color.surfaceAlt}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: theme.color.text, fontWeight: theme.typography.label.fontWeight, fontSize: theme.typography.body.fontSize }}>
                    {b.name}
                  </div>
                  <div style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
                    {b.address} · {b.hours}
                  </div>
                </div>
                <button type="button" className="cr-act" onClick={() => onDelete(b.id)} style={{ color: theme.color.danger, whiteSpace: 'nowrap' }}>
                  {t('common.remove')}
                </button>
              </AnimatedRow>
            ))}
          </AnimatedList>
        )}
      </Panel>

      <Panel title={t('branches.addBranch')}>
        <form
          onSubmit={add}
          style={{ maxWidth: FORM_MAX_WIDTH, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: theme.spacing.md, rowGap: 0 }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <TextField label={t('branches.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <TextField label={t('branches.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <TextField label={t('branches.lat')} type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <TextField label={t('branches.lng')} type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <TextField label={t('branches.hours')} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </div>
          {error && <p style={{ gridColumn: '1 / -1', margin: `0 0 ${theme.spacing.md}px`, color: theme.color.danger }}>{error}</p>}
          <div style={{ gridColumn: '1 / -1' }}>
            <Button type="submit" fullWidth={false} disabled={isLoading}>
              {isLoading ? t('branches.adding') : t('branches.addBranch')}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
