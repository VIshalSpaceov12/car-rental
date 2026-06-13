import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import {
  BookingError,
  createBooking,
  listForUser,
  listVehicleBranchOptions,
  prepareBooking,
  quote,
  transition,
  type BookingAction,
} from './booking.service'

export const bookingsRouter: Router = Router()

// `endAt` must be strictly after `startAt`; applied here so /quote and /bookings
// both reject backwards/zero ranges with 400 (createBooking re-checks defensively).
const quoteSchema = z
  .object({
    vehicleId: z.string().min(1),
    plan: z.enum(['daily', 'weekly', 'monthly', 'long-term']),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    discountCode: z.string().optional(),
  })
  .refine((d) => new Date(d.endAt).getTime() > new Date(d.startAt).getTime(), {
    message: 'endAt must be after startAt',
    path: ['endAt'],
  })

const createSchema = z
  .object({
    vehicleId: z.string().min(1),
    plan: z.enum(['daily', 'weekly', 'monthly', 'long-term']),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    discountCode: z.string().optional(),
    pickupBranchId: z.string().min(1),
    dropoffBranchId: z.string().min(1),
  })
  .refine((d) => new Date(d.endAt).getTime() > new Date(d.startAt).getTime(), {
    message: 'endAt must be after startAt',
    path: ['endAt'],
  })

const prepareSchema = z.object({
  prepReadyAt: z.string().datetime().optional(),
})

bookingsRouter.post('/quote', requireAuth, requireRole('customer'), async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
    return
  }
  try {
    res.json(await quote(parsed.data))
  } catch (err) {
    handle(err, res)
  }
})

bookingsRouter.post('/', requireAuth, requireRole('customer'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
    return
  }
  try {
    res.status(201).json(await createBooking(req.user!.id, parsed.data))
  } catch (err) {
    handle(err, res)
  }
})

bookingsRouter.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await listForUser(req.user!))
  } catch (err) {
    handle(err, res)
  }
})

bookingsRouter.get(
  '/vehicles/:vehicleId/branches',
  requireAuth,
  requireRole('customer'),
  async (req: Request<{ vehicleId: string }>, res: Response) => {
    try {
      res.json(await listVehicleBranchOptions(req.params.vehicleId))
    } catch (err) {
      handle(err, res)
    }
  },
)

// Provider drives accept/reject/prepare/provider-cancel; the customer cancels their own booking.
const runAction = (action: BookingAction) => async (req: Request<{ id: string }>, res: Response) => {
  try {
    res.json(await transition(req.user!, req.params.id, action))
  } catch (err) {
    handle(err, res)
  }
}

bookingsRouter.post('/:id/accept', requireAuth, requireRole('service-provider'), runAction('accept'))
bookingsRouter.post('/:id/reject', requireAuth, requireRole('service-provider'), runAction('reject'))
bookingsRouter.post('/:id/cancel', requireAuth, requireRole('customer'), runAction('cancel'))
bookingsRouter.post('/:id/provider-cancel', requireAuth, requireRole('service-provider'), runAction('provider-cancel'))

// Prepare carries an optional prepReadyAt and persists it alongside the transition.
bookingsRouter.post(
  '/:id/prepare',
  requireAuth,
  requireRole('service-provider'),
  async (req: Request<{ id: string }>, res: Response) => {
    const parsed = prepareSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
      return
    }
    try {
      res.json(await prepareBooking(req.user!, req.params.id, parsed.data))
    } catch (err) {
      handle(err, res)
    }
  },
)

function handle(err: unknown, res: Response): void {
  if (err instanceof BookingError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
