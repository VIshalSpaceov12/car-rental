import { useState, type FormEvent } from 'react'
import type { FuelType, Transmission } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { useAppSelector } from '../../store/hooks'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateVehicleMutation,
  useDeleteCategoryMutation,
  useDeleteVehicleMutation,
  useVehiclesQuery,
} from '../../store/fleetApi'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

const TRANSMISSIONS: Transmission[] = ['automatic', 'manual']
const FUELS: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid']

export function FleetPage() {
  const theme = useTheme()
  const providerId = useAppSelector((s) => s.auth.user?.providerId) ?? undefined
  const { data: vehicles = [] } = useVehiclesQuery(providerId)
  const { data: categories = [] } = useCategoriesQuery()
  const [createVehicle, { isLoading: creating }] = useCreateVehicleMutation()
  const [deleteVehicle] = useDeleteVehicleMutation()
  const [createCategory] = useCreateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const [catName, setCatName] = useState('')
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    transmission: 'automatic' as Transmission,
    fuelType: 'petrol' as FuelType,
    seats: '5',
    pricePerDay: '150',
    currency: 'AED',
  })

  const addCategory = async (e: FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return
    await createCategory(catName.trim())
    setCatName('')
  }

  const addVehicle = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.categoryId || !form.name.trim()) return
    await createVehicle({
      name: form.name.trim(),
      categoryId: form.categoryId,
      transmission: form.transmission,
      fuelType: form.fuelType,
      seats: Number(form.seats),
      pricePerDay: Number(form.pricePerDay),
      currency: form.currency,
    })
    setForm({ ...form, name: '' })
  }

  const selectStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.color.textMuted}`,
    marginBottom: theme.spacing.md,
  }

  return (
    <div>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>Fleet</h1>

      <section style={{ marginBottom: theme.spacing.xl }}>
        <h2 style={{ color: theme.color.text }}>Categories</h2>
        <ul style={{ color: theme.color.text }}>
          {categories.map((c) => (
            <li key={c.id} style={{ marginBottom: theme.spacing.xs }}>
              {c.name}{' '}
              <a
                onClick={() => deleteCategory(c.id)}
                style={{ color: theme.color.danger, cursor: 'pointer' }}
              >
                remove
              </a>
            </li>
          ))}
          {categories.length === 0 && (
            <li style={{ color: theme.color.textMuted }}>No categories yet — add one to enable vehicles.</li>
          )}
        </ul>
        <form onSubmit={addCategory} style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <TextField label="New category" value={catName} onChange={(e) => setCatName(e.target.value)} />
          </div>
          <div style={{ width: 120, marginBottom: theme.spacing.md }}>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </section>

      <section style={{ marginBottom: theme.spacing.xl }}>
        <h2 style={{ color: theme.color.text }}>Vehicles ({vehicles.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.color.text }}>
          <thead>
            <tr style={{ textAlign: 'left', color: theme.color.textMuted }}>
              <th>Name</th>
              <th>Category</th>
              <th>Transmission</th>
              <th>Fuel</th>
              <th>Seats</th>
              <th>Price/day</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} style={{ borderTop: `1px solid ${theme.color.surface}` }}>
                <td>{v.name}</td>
                <td>{v.category}</td>
                <td>{v.transmission}</td>
                <td>{v.fuelType}</td>
                <td>{v.seats}</td>
                <td>
                  {v.pricePerDay} {v.currency}
                </td>
                <td>
                  <a
                    onClick={() => deleteVehicle(v.id)}
                    style={{ color: theme.color.danger, cursor: 'pointer' }}
                  >
                    delete
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ color: theme.color.text }}>Add vehicle</h2>
        <form onSubmit={addVehicle} style={{ maxWidth: 420 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label style={{ color: theme.color.text }}>Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            style={selectStyle}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label style={{ color: theme.color.text }}>Transmission</label>
          <select
            value={form.transmission}
            onChange={(e) => setForm({ ...form, transmission: e.target.value as Transmission })}
            style={selectStyle}
          >
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label style={{ color: theme.color.text }}>Fuel</label>
          <select
            value={form.fuelType}
            onChange={(e) => setForm({ ...form, fuelType: e.target.value as FuelType })}
            style={selectStyle}
          >
            {FUELS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <TextField
            label="Seats"
            type="number"
            value={form.seats}
            onChange={(e) => setForm({ ...form, seats: e.target.value })}
          />
          <TextField
            label="Price per day"
            type="number"
            value={form.pricePerDay}
            onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
          />
          <Button type="submit" disabled={creating || !form.categoryId}>
            {creating ? 'Adding…' : 'Add vehicle'}
          </Button>
        </form>
      </section>
    </div>
  )
}
