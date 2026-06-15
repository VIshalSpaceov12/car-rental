import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import {
  BookingError,
  completeBooking,
  createBooking,
  getRating,
  getReturnInspection,
  listForUser,
  listVehicleBranchOptions,
  prepareBooking,
  quote,
  rateBooking,
  returnBooking,
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

const completeSchema = z.object({
  condition: z.enum(['clean', 'minor-damage', 'major-damage']),
  notes: z.string().optional(),
})

const ratingSchema = z.object({
  vehicleRating: z.number().int().min(1).max(5),
  serviceRating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
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

// Provider drives reject/prepare/provider-cancel; the customer cancels their own
// booking. Confirmation is driven by payment (see payments module), not a manual
// provider action.
const runAction = (action: BookingAction) => async (req: Request<{ id: string }>, res: Response) => {
  try {
    res.json(await transition(req.user!, req.params.id, action))
  } catch (err) {
    handle(err, res)
  }
}

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

// Keyless return flow: the customer returns the vehicle; the provider inspects
// and completes it, recording the vehicle's condition.
bookingsRouter.post('/:id/return', requireAuth, requireRole('customer'), async (req: Request<{ id: string }>, res: Response) => {
  try {
    res.json(await returnBooking(req.user!, req.params.id))
  } catch (err) {
    handle(err, res)
  }
})

bookingsRouter.post(
  '/:id/complete',
  requireAuth,
  requireRole('service-provider'),
  async (req: Request<{ id: string }>, res: Response) => {
    const parsed = completeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
      return
    }
    try {
      res.json(await completeBooking(req.user!, req.params.id, parsed.data))
    } catch (err) {
      handle(err, res)
    }
  },
)

bookingsRouter.get(
  '/:id/inspection',
  requireAuth,
  requireRole('service-provider'),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      res.json(await getReturnInspection(req.user!, req.params.id))
    } catch (err) {
      handle(err, res)
    }
  },
)

// Post-rental rating: the customer rates a completed booking; both parties can read it.
bookingsRouter.post(
  '/:id/rating',
  requireAuth,
  requireRole('customer'),
  async (req: Request<{ id: string }>, res: Response) => {
    const parsed = ratingSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
      return
    }
    try {
      res.status(201).json(await rateBooking(req.user!, req.params.id, parsed.data))
    } catch (err) {
      handle(err, res)
    }
  },
)

bookingsRouter.get(
  '/:id/rating',
  requireAuth,
  requireRole('customer', 'service-provider'),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      res.json(await getRating(req.user!, req.params.id))
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
