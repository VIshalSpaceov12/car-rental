import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import {
  BookingError,
  createBooking,
  listForUser,
  listVehicleBranchOptions,
  quote,
  transition,
  type BookingAction,
} from './booking.service'

export const bookingsRouter: Router = Router()

const quoteSchema = z.object({
  vehicleId: z.string().min(1),
  plan: z.enum(['daily', 'weekly', 'monthly', 'long-term']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  discountCode: z.string().optional(),
})

const createSchema = quoteSchema.extend({
  pickupBranchId: z.string().min(1),
  dropoffBranchId: z.string().min(1),
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

// Provider drives accept/reject/prepare; the customer cancels their own booking.
const runAction = (action: BookingAction) => async (req: Request<{ id: string }>, res: Response) => {
  try {
    res.json(await transition(req.user!, req.params.id, action))
  } catch (err) {
    handle(err, res)
  }
}

bookingsRouter.post('/:id/accept', requireAuth, requireRole('service-provider'), runAction('accept'))
bookingsRouter.post('/:id/reject', requireAuth, requireRole('service-provider'), runAction('reject'))
bookingsRouter.post('/:id/prepare', requireAuth, requireRole('service-provider'), runAction('prepare'))
bookingsRouter.post('/:id/cancel', requireAuth, requireRole('customer'), runAction('cancel'))

function handle(err: unknown, res: Response): void {
  if (err instanceof BookingError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
