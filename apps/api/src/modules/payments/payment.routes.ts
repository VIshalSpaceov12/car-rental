import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import { PaymentError, pay } from './payment.service'

export const paymentsRouter: Router = Router()

const paySchema = z.object({
  method: z.enum(['card-mock', 'cash-on-delivery']),
  simulateFailure: z.boolean().optional(),
})

// Customer pays for their reserved booking; payment is the reserved→confirmed trigger.
paymentsRouter.post(
  '/:bookingId/pay',
  requireAuth,
  requireRole('customer'),
  async (req: Request<{ bookingId: string }>, res: Response) => {
    const parsed = paySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
      return
    }
    try {
      res.status(201).json(await pay(req.user!.id, req.params.bookingId, parsed.data))
    } catch (err) {
      handle(err, res)
    }
  },
)

function handle(err: unknown, res: Response): void {
  if (err instanceof PaymentError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
