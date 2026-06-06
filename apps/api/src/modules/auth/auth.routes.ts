import { Router, type Response } from 'express'
import { z } from 'zod'
import { AuthError, login, register } from './auth.service'
import { requireAuth } from './auth.middleware'

export const authRouter: Router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['customer', 'service-provider']),
  phone: z.string().optional(),
  locale: z.enum(['en', 'ar']).optional(),
  businessName: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
    return
  }
  try {
    res.status(201).json(await register(parsed.data))
  } catch (err) {
    handle(err, res)
  }
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid request' })
    return
  }
  try {
    res.json(await login(parsed.data))
  } catch (err) {
    handle(err, res)
  }
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

function handle(err: unknown, res: Response): void {
  if (err instanceof AuthError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
