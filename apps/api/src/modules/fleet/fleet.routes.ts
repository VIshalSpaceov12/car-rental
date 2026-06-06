import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import * as repo from './fleet.repository'

export const vehiclesRouter: Router = Router()
export const categoriesRouter: Router = Router()
export const branchesRouter: Router = Router()

const transmission = z.enum(['automatic', 'manual'])
const fuelType = z.enum(['petrol', 'diesel', 'electric', 'hybrid'])

const createVehicleSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  transmission,
  fuelType,
  seats: z.number().int().positive(),
  pricePerDay: z.number().positive(),
  currency: z.string().min(1),
  images: z.array(z.string()).optional(),
  available: z.boolean().optional(),
})
const updateVehicleSchema = createVehicleSchema.partial()

const filtersSchema = z.object({
  providerId: z.string().optional(),
  categoryId: z.string().optional(),
  transmission: transmission.optional(),
  fuelType: fuelType.optional(),
  maxPrice: z.coerce.number().positive().optional(),
  available: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

const createBranchSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  hours: z.string().min(1),
})

function providerId(req: Request): string | null {
  return req.user?.providerId ?? null
}

const providerOnly = [requireAuth, requireRole('service-provider')] as const

// ---------- Vehicles ----------

vehiclesRouter.get('/', async (req, res) => {
  const parsed = filtersSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid filters' })
    return
  }
  try {
    res.json(await repo.listVehicles(parsed.data))
  } catch (err) {
    fail(err, res)
  }
})

vehiclesRouter.get('/:id', async (req, res) => {
  try {
    const vehicle = await repo.getVehicle(req.params.id!)
    if (!vehicle) {
      res.status(404).json({ error: 'vehicle not found' })
      return
    }
    res.json(vehicle)
  } catch (err) {
    fail(err, res)
  }
})

vehiclesRouter.post('/', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  const parsed = createVehicleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
    return
  }
  try {
    res.status(201).json(await repo.createVehicle(pid, parsed.data))
  } catch (err) {
    fail(err, res)
  }
})

vehiclesRouter.patch('/:id', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  const parsed = updateVehicleSchema.safeParse(req.body)
  if (!parsed.success) return void res.status(400).json({ error: 'invalid request' })
  try {
    const updated = await repo.updateVehicle(req.params.id!, pid, parsed.data)
    if (!updated) return void res.status(404).json({ error: 'vehicle not found' })
    res.json(updated)
  } catch (err) {
    fail(err, res)
  }
})

vehiclesRouter.delete('/:id', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  try {
    const ok = await repo.deleteVehicle(req.params.id!, pid)
    res.status(ok ? 204 : 404).end()
  } catch (err) {
    fail(err, res)
  }
})

// ---------- Categories (provider-scoped) ----------

categoriesRouter.get('/', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  try {
    res.json(await repo.listCategories(pid))
  } catch (err) {
    fail(err, res)
  }
})

categoriesRouter.post('/', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body)
  if (!parsed.success) return void res.status(400).json({ error: 'invalid request' })
  try {
    res.status(201).json(await repo.createCategory(pid, parsed.data.name))
  } catch (err) {
    fail(err, res)
  }
})

categoriesRouter.delete('/:id', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  try {
    const ok = await repo.deleteCategory(req.params.id!, pid)
    res.status(ok ? 204 : 404).end()
  } catch (err) {
    fail(err, res)
  }
})

// ---------- Branches (provider-scoped) ----------

branchesRouter.get('/', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  try {
    res.json(await repo.listBranches(pid))
  } catch (err) {
    fail(err, res)
  }
})

branchesRouter.post('/', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  const parsed = createBranchSchema.safeParse(req.body)
  if (!parsed.success) return void res.status(400).json({ error: 'invalid request' })
  try {
    res.status(201).json(await repo.createBranch(pid, parsed.data))
  } catch (err) {
    fail(err, res)
  }
})

branchesRouter.delete('/:id', ...providerOnly, async (req, res) => {
  const pid = providerId(req)
  if (!pid) return void res.status(400).json({ error: 'provider has no tenant' })
  try {
    const ok = await repo.deleteBranch(req.params.id!, pid)
    res.status(ok ? 204 : 404).end()
  } catch (err) {
    fail(err, res)
  }
})

function fail(err: unknown, res: Response): void {
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
