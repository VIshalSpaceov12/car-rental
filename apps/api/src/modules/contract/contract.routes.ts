import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import { ContractError, getContract, signContract } from './contract.service'

export const contractsRouter: Router = Router()

const signSchema = z.object({
  signerName: z.string().min(1),
  consent: z.boolean(),
})

// Both the owning customer and provider can view the contract (dashboard + app).
contractsRouter.get(
  '/:bookingId',
  requireAuth,
  requireRole('customer', 'service-provider'),
  async (req: Request<{ bookingId: string }>, res: Response) => {
    try {
      res.json(await getContract(req.user!, req.params.bookingId))
    } catch (err) {
      handle(err, res)
    }
  },
)

// Customer signs → booking moves to picked-up.
contractsRouter.post(
  '/:bookingId/sign',
  requireAuth,
  requireRole('customer'),
  async (req: Request<{ bookingId: string }>, res: Response) => {
    const parsed = signSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
      return
    }
    try {
      res.json(await signContract(req.user!, req.params.bookingId, parsed.data))
    } catch (err) {
      handle(err, res)
    }
  },
)

function handle(err: unknown, res: Response): void {
  if (err instanceof ContractError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
