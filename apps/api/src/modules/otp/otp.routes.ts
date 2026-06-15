import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import { OtpError, getSummary, issue, verify } from './otp.service'

export const otpsRouter: Router = Router()

const verifySchema = z.object({
  bookingId: z.string().min(1),
  vehicleId: z.string().min(1),
  otp: z.string().min(1),
})

// Provider issues a pickup OTP for a vehicle-prepared booking it owns.
otpsRouter.post(
  '/:bookingId/issue',
  requireAuth,
  requireRole('service-provider'),
  async (req: Request<{ bookingId: string }>, res: Response) => {
    try {
      res.status(201).json(await issue(req.user!, req.params.bookingId))
    } catch (err) {
      handle(err, res)
    }
  },
)

// Customer verifies a code to unlock the lock-box.
otpsRouter.post('/verify', requireAuth, requireRole('customer'), async (req, res) => {
  const parsed = verifySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
    return
  }
  try {
    res.json(await verify(req.user!, parsed.data))
  } catch (err) {
    handle(err, res)
  }
})

// Provider tracks a booking's OTP status (never returns the code).
otpsRouter.get(
  '/:bookingId',
  requireAuth,
  requireRole('service-provider'),
  async (req: Request<{ bookingId: string }>, res: Response) => {
    try {
      res.json(await getSummary(req.user!, req.params.bookingId))
    } catch (err) {
      handle(err, res)
    }
  },
)

function handle(err: unknown, res: Response): void {
  if (err instanceof OtpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
