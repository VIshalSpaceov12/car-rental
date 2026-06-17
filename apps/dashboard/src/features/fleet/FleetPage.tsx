import { useState, type FormEvent } from 'react'
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
const FORM_MAX_WIDTH = 420

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  transmission: 'automatic' as Transmission,
  fuelType: 'petrol' as FuelType,
  seats: '5',
  pricePerDay: '150',
  currency: 'AED',
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

  const selectStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.color.textMuted}`,
    marginBottom: theme.spacing.md,
  }

  const saving = creating || updating

  return (
    <div>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>{t('fleet.title')}</h1>
      {actionFailed && <p style={{ color: theme.color.danger }}>{t('fleet.actionFailed')}</p>}

      <section style={{ marginBottom: theme.spacing.xl }}>
        <h2 style={{ color: theme.color.text }}>{t('fleet.categories')}</h2>
        <ul style={{ color: theme.color.text }}>
          {categories.map((c) => (
            <li key={c.id} style={{ marginBottom: theme.spacing.xs }}>
              {c.name}{' '}
              <a
                onClick={() => onDeleteCategory(c.id)}
                style={{ color: theme.color.danger, cursor: 'pointer' }}
              >
                {t('common.remove')}
              </a>
            </li>
          ))}
          {categories.length === 0 && (
            <li style={{ color: theme.color.textMuted }}>{t('fleet.noCategories')}</li>
          )}
        </ul>
        <form onSubmit={addCategory} style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <TextField label={t('fleet.newCategory')} value={catName} onChange={(e) => setCatName(e.target.value)} />
          </div>
          <div style={{ width: ADD_BUTTON_WIDTH, marginBottom: theme.spacing.md }}>
            <Button type="submit">{t('common.add')}</Button>
          </div>
        </form>
      </section>

      <section style={{ marginBottom: theme.spacing.xl }}>
        <h2 style={{ color: theme.color.text }}>{t('fleet.vehicles', { count: vehicles.length })}</h2>
        {vehiclesLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={theme.spacing.xl} />
            ))}
          </div>
        )}
        {vehiclesError && <p style={{ color: theme.color.danger }}>{t('fleet.loadFailed')}</p>}
        {!vehiclesLoading && !vehiclesError && (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.color.text }}>
            <thead>
              <tr style={{ textAlign: 'start', color: theme.color.textMuted }}>
                <th>{t('fleet.colName')}</th>
                <th>{t('fleet.colCategory')}</th>
                <th>{t('fleet.colTransmission')}</th>
                <th>{t('fleet.colFuel')}</th>
                <th>{t('fleet.colSeats')}</th>
                <th>{t('fleet.colPrice')}</th>
                <th />
              </tr>
            </thead>
            <AnimatedTableBody>
              {vehicles.map((v) => (
                <AnimatedTableRow key={v.id} style={{ borderTop: `1px solid ${theme.color.surface}` }}>
                  <td>{v.name}</td>
                  <td>{v.category}</td>
                  <td>{t(TRANSMISSION_LABEL_KEY[v.transmission])}</td>
                  <td>{t(FUEL_LABEL_KEY[v.fuelType])}</td>
                  <td>{v.seats}</td>
                  <td>
                    {v.pricePerDay} {v.currency}
                  </td>
                  <td>
                    <a
                      onClick={() => startEdit(v.id)}
                      style={{ color: theme.color.primary, cursor: 'pointer', marginInlineEnd: theme.spacing.sm }}
                    >
                      {t('common.edit')}
                    </a>
                    <a
                      onClick={() => onDeleteVehicle(v.id)}
                      style={{ color: theme.color.danger, cursor: 'pointer' }}
                    >
                      {t('common.delete')}
                    </a>
                  </td>
                </AnimatedTableRow>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: theme.color.textMuted, paddingTop: theme.spacing.sm }}>
                    {t('fleet.noVehicles')}
                  </td>
                </tr>
              )}
            </AnimatedTableBody>
          </table>
        )}
      </section>

      <section>
        <h2 style={{ color: theme.color.text }}>{editingId ? t('fleet.editVehicle') : t('fleet.addVehicle')}</h2>
        <form onSubmit={submitVehicle} style={{ maxWidth: FORM_MAX_WIDTH }}>
          <TextField label={t('fleet.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label style={{ color: theme.color.text }}>{t('fleet.category')}</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            style={selectStyle}
          >
            <option value="">{t('fleet.selectCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label style={{ color: theme.color.text }}>{t('fleet.transmission')}</label>
          <select
            value={form.transmission}
            onChange={(e) => setForm({ ...form, transmission: e.target.value as Transmission })}
            style={selectStyle}
          >
            {TRANSMISSIONS.map((tr) => (
              <option key={tr} value={tr}>
                {t(TRANSMISSION_LABEL_KEY[tr])}
              </option>
            ))}
          </select>
          <label style={{ color: theme.color.text }}>{t('fleet.fuel')}</label>
          <select
            value={form.fuelType}
            onChange={(e) => setForm({ ...form, fuelType: e.target.value as FuelType })}
            style={selectStyle}
          >
            {FUELS.map((f) => (
              <option key={f} value={f}>
                {t(FUEL_LABEL_KEY[f])}
              </option>
            ))}
          </select>
          <TextField
            label={t('fleet.seats')}
            type="number"
            value={form.seats}
            onChange={(e) => setForm({ ...form, seats: e.target.value })}
          />
          <TextField
            label={t('fleet.pricePerDay')}
            type="number"
            value={form.pricePerDay}
            onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
          />
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Button type="submit" disabled={saving || !form.categoryId}>
              {saving
                ? editingId
                  ? t('fleet.saving')
                  : t('fleet.adding')
                : editingId
                  ? t('common.save')
                  : t('fleet.addVehicle')}
            </Button>
            {editingId && (
              <Button type="button" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
