import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { FuelType, Transmission } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateVehicleMutation,
  useDeleteCategoryMutation,
  useDeleteVehicleMutation,
  useProviderVehiclesQuery,
  useUpdateVehicleMutation,
} from '../../store/fleetApi'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedTableBody, AnimatedTableRow } from '../../components/AnimatedRow'
import { useToast } from '../../components/Toast'

const TRANSMISSIONS: Transmission[] = ['automatic', 'manual']
const FUELS: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid']

// Enum values are localized for display; the raw enum is the wire/storage value.
const TRANSMISSION_LABEL_KEY: Record<
  Transmission,
  'fleet.transmissionValue.automatic' | 'fleet.transmissionValue.manual'
> = {
  automatic: 'fleet.transmissionValue.automatic',
  manual: 'fleet.transmissionValue.manual',
}
const FUEL_LABEL_KEY: Record<
  FuelType,
  | 'fleet.fuelValue.petrol'
  | 'fleet.fuelValue.diesel'
  | 'fleet.fuelValue.electric'
  | 'fleet.fuelValue.hybrid'
> = {
  petrol: 'fleet.fuelValue.petrol',
  diesel: 'fleet.fuelValue.diesel',
  electric: 'fleet.fuelValue.electric',
  hybrid: 'fleet.fuelValue.hybrid',
}

// One-off layout dimensions (no semantic size fits) — kept as named consts here,
// not as design tokens.
const ADD_BUTTON_WIDTH = 120
const FORM_MAX_WIDTH = 560

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  transmission: 'automatic' as Transmission,
  fuelType: 'petrol' as FuelType,
  seats: '5',
  pricePerDay: '150',
  currency: 'AED',
}

/** #RGB / #RRGGBB → rgba() at the given alpha; non-hex falls back to itself. */
function rgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return hex
  const raw = m[1] ?? ''
  const h = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Labelled `<select>` mirroring TextField's label + bordered control. */
function LabeledSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  const theme = useTheme()
  return (
    <label style={{ display: 'block', marginBottom: theme.spacing.md }}>
      <span style={{ display: 'block', color: theme.color.text, marginBottom: theme.spacing.xs, fontSize: theme.typography.body.fontSize }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: theme.spacing.sm,
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.color.border}`,
          background: theme.color.background,
          color: theme.color.text,
          fontSize: theme.typography.body.fontSize,
        }}
      >
        {children}
      </select>
    </label>
  )
}

export function FleetPage() {
  const theme = useTheme()
  const { t } = useTranslation()
  const toast = useToast()
  const {
    data: vehicles = [],
    isLoading: vehiclesLoading,
    isError: vehiclesError,
  } = useProviderVehiclesQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const [createVehicle, { isLoading: creating }] = useCreateVehicleMutation()
  const [updateVehicle, { isLoading: updating }] = useUpdateVehicleMutation()
  const [deleteVehicle] = useDeleteVehicleMutation()
  const [createCategory] = useCreateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const [catName, setCatName] = useState('')
  // When set, the form edits this vehicle (reuses the create form in edit mode).
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [actionFailed, setActionFailed] = useState(false)

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const startEdit = (id: string) => {
    const v = vehicles.find((x) => x.id === id)
    if (!v) return
    setEditingId(id)
    setForm({
      name: v.name,
      categoryId: v.categoryId,
      transmission: v.transmission,
      fuelType: v.fuelType,
      seats: String(v.seats),
      pricePerDay: String(v.pricePerDay),
      currency: v.currency,
    })
    if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const addCategory = async (e: FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return
    setActionFailed(false)
    try {
      await createCategory(catName.trim()).unwrap()
      setCatName('')
      toast.show(t('toast.saved'), 'success')
    } catch {
      setActionFailed(true)
      toast.show(t('toast.saveFailed'), 'error')
    }
  }

  const submitVehicle = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.categoryId || !form.name.trim()) return
    setActionFailed(false)
    const body = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      transmission: form.transmission,
      fuelType: form.fuelType,
      seats: Number(form.seats),
      pricePerDay: Number(form.pricePerDay),
      currency: form.currency,
    }
    try {
      if (editingId) {
        await updateVehicle({ id: editingId, body }).unwrap()
      } else {
        await createVehicle(body).unwrap()
      }
      resetForm()
      toast.show(t('toast.saved'), 'success')
    } catch {
      setActionFailed(true)
      toast.show(t('toast.saveFailed'), 'error')
    }
  }

  const onDeleteVehicle = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    setActionFailed(false)
    try {
      await deleteVehicle(id).unwrap()
      toast.show(t('toast.deleted'), 'success')
    } catch {
      setActionFailed(true)
      toast.show(t('toast.deleteFailed'), 'error')
    }
  }

  const onDeleteCategory = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    setActionFailed(false)
    try {
      await deleteCategory(id).unwrap()
      toast.show(t('toast.deleted'), 'success')
    } catch {
      setActionFailed(true)
      toast.show(t('toast.deleteFailed'), 'error')
    }
  }

  const saving = creating || updating

  const th: CSSProperties = {
    textAlign: 'start',
    color: theme.color.textMuted,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingBlock: theme.spacing.sm,
    paddingInlineEnd: theme.spacing.md,
    borderBottom: `1px solid ${theme.color.border}`,
    whiteSpace: 'nowrap',
  }
  const td: CSSProperties = {
    paddingBlock: theme.spacing.md,
    paddingInlineEnd: theme.spacing.md,
    borderBottom: `1px solid ${theme.color.surfaceAlt}`,
    color: theme.color.text,
    fontSize: theme.typography.body.fontSize,
    verticalAlign: 'middle',
  }

  // Scoped hover affordances (the codebase styles inline; :hover needs CSS).
  const hoverCss = `
    .cr-fleet-row { transition: background-color 140ms ease; }
    .cr-fleet-row:hover { background-color: ${rgba(theme.color.primary, 0.05)}; }
    .cr-act { border: none; background: transparent; cursor: pointer; border-radius: ${theme.radius.pill}px;
      padding: 4px 10px; font-size: ${theme.typography.caption.fontSize}px; font-weight: ${theme.typography.label.fontWeight};
      transition: background-color 140ms ease; }
    .cr-act:hover { background-color: ${theme.color.surfaceAlt}; }
    .cr-chip-x { border: none; background: transparent; cursor: pointer; line-height: 1; padding: 0 2px;
      color: ${theme.color.textMuted}; font-size: ${theme.typography.body.fontSize}px; transition: color 140ms ease; }
    .cr-chip-x:hover { color: ${theme.color.danger}; }
  `

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <style>{hoverCss}</style>

      {/* Page header */}
      <div>
        <h1 style={{ margin: 0, color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.display.fontWeight, letterSpacing: -0.5 }}>
          {t('fleet.title')}
        </h1>
        <p style={{ margin: `${theme.spacing.xs}px 0 0`, color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
          {t('fleet.subtitle')}
        </p>
      </div>

      {actionFailed && (
        <p style={{ margin: 0, color: theme.color.danger, fontSize: theme.typography.body.fontSize }}>{t('fleet.actionFailed')}</p>
      )}

      {/* Categories */}
      <Panel title={t('fleet.categories')}>
        {categories.length === 0 ? (
          <p style={{ margin: 0, color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>{t('fleet.noCategories')}</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {categories.map((c) => (
              <span
                key={c.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  background: rgba(theme.color.primary, 0.08),
                  color: theme.color.text,
                  border: `1px solid ${rgba(theme.color.primary, 0.2)}`,
                  borderRadius: theme.radius.pill,
                  paddingBlock: 4,
                  paddingInline: theme.spacing.sm,
                  fontSize: theme.typography.caption.fontSize,
                  fontWeight: theme.typography.label.fontWeight,
                }}
              >
                {c.name}
                <button
                  type="button"
                  className="cr-chip-x"
                  onClick={() => onDeleteCategory(c.id)}
                  aria-label={`${t('common.remove')} ${c.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={addCategory} style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-end', marginBlockStart: theme.spacing.lg, maxWidth: FORM_MAX_WIDTH }}>
          <div style={{ flex: 1 }}>
            <TextField label={t('fleet.newCategory')} value={catName} onChange={(e) => setCatName(e.target.value)} />
          </div>
          <div style={{ width: ADD_BUTTON_WIDTH, marginBottom: theme.spacing.md }}>
            <Button type="submit">{t('common.add')}</Button>
          </div>
        </form>
      </Panel>

      {/* Vehicles */}
      <Panel title={t('fleet.vehicles', { count: vehicles.length })}>
        {vehiclesLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={theme.spacing.xl} />
            ))}
          </div>
        )}
        {vehiclesError && <p style={{ margin: 0, color: theme.color.danger }}>{t('fleet.loadFailed')}</p>}
        {!vehiclesLoading && !vehiclesError && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={th}>{t('fleet.colName')}</th>
                  <th style={th}>{t('fleet.colCategory')}</th>
                  <th style={th}>{t('fleet.colTransmission')}</th>
                  <th style={th}>{t('fleet.colFuel')}</th>
                  <th style={th}>{t('fleet.colSeats')}</th>
                  <th style={th}>{t('fleet.colPrice')}</th>
                  <th style={{ ...th, textAlign: 'end', paddingInlineEnd: 0 }} />
                </tr>
              </thead>
              <AnimatedTableBody>
                {vehicles.map((v) => (
                  <AnimatedTableRow key={v.id} className="cr-fleet-row">
                    <td style={{ ...td, fontWeight: theme.typography.label.fontWeight }}>{v.name}</td>
                    <td style={td}>
                      <span
                        style={{
                          display: 'inline-block',
                          background: theme.color.surfaceAlt,
                          color: theme.color.textMuted,
                          borderRadius: theme.radius.pill,
                          paddingBlock: 2,
                          paddingInline: theme.spacing.sm,
                          fontSize: theme.typography.caption.fontSize,
                        }}
                      >
                        {v.category}
                      </span>
                    </td>
                    <td style={td}>{t(TRANSMISSION_LABEL_KEY[v.transmission])}</td>
                    <td style={td}>{t(FUEL_LABEL_KEY[v.fuelType])}</td>
                    <td style={td}>{v.seats}</td>
                    <td style={{ ...td, fontWeight: theme.typography.label.fontWeight, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {v.pricePerDay}{' '}
                      <span style={{ color: theme.color.textMuted, fontWeight: theme.typography.body.fontWeight }}>{v.currency}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'end', paddingInlineEnd: 0, whiteSpace: 'nowrap' }}>
                      <button type="button" className="cr-act" onClick={() => startEdit(v.id)} style={{ color: theme.color.primary }}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="cr-act" onClick={() => onDeleteVehicle(v.id)} style={{ color: theme.color.danger }}>
                        {t('common.delete')}
                      </button>
                    </td>
                  </AnimatedTableRow>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...td, color: theme.color.textMuted, borderBottom: 'none' }}>
                      {t('fleet.noVehicles')}
                    </td>
                  </tr>
                )}
              </AnimatedTableBody>
            </table>
          </div>
        )}
      </Panel>

      {/* Add / edit vehicle */}
      <Panel title={editingId ? t('fleet.editVehicle') : t('fleet.addVehicle')}>
        <form
          onSubmit={submitVehicle}
          style={{ maxWidth: FORM_MAX_WIDTH, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: theme.spacing.md, rowGap: 0 }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <TextField label={t('fleet.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <LabeledSelect label={t('fleet.category')} value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })}>
              <option value="">{t('fleet.selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </LabeledSelect>
          </div>
          <LabeledSelect label={t('fleet.transmission')} value={form.transmission} onChange={(value) => setForm({ ...form, transmission: value as Transmission })}>
            {TRANSMISSIONS.map((tr) => (
              <option key={tr} value={tr}>
                {t(TRANSMISSION_LABEL_KEY[tr])}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect label={t('fleet.fuel')} value={form.fuelType} onChange={(value) => setForm({ ...form, fuelType: value as FuelType })}>
            {FUELS.map((f) => (
              <option key={f} value={f}>
                {t(FUEL_LABEL_KEY[f])}
              </option>
            ))}
          </LabeledSelect>
          <TextField label={t('fleet.seats')} type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
          <TextField label={t('fleet.pricePerDay')} type="number" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: theme.spacing.sm, marginBlockStart: theme.spacing.sm }}>
            <Button type="submit" fullWidth={false} disabled={saving || !form.categoryId}>
              {saving
                ? editingId
                  ? t('fleet.saving')
                  : t('fleet.adding')
                : editingId
                  ? t('common.save')
                  : t('fleet.addVehicle')}
            </Button>
            {editingId && (
              <Button type="button" fullWidth={false} onClick={resetForm}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </form>
      </Panel>
    </div>
  )
}
