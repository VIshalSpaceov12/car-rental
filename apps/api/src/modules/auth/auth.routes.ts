import { Router, type Response } from 'express'
import { z } from 'zod'
import { AuthError, brandingForProvider, getBranding, login, register, updateBranding } from './auth.service'
import { requireAuth, requireRole } from './auth.middleware'

export const authRouter: Router = Router()

// Emails are normalized (lowercased + trimmed) on both register and login so
// sign-up and sign-in are case-insensitive and match the stored unique value.
const email = z.string().email().transform((v) => v.toLowerCase().trim())

const colorsSchema = z.object({
  primary: z.string().min(1),
  primaryDark: z.string().min(1).optional(),
  background: z.string().min(1).optional(),
})

const registerSchema = z
  .object({
    email,
    password: z.string().min(8),
    name: z.string().min(1),
    role: z.enum(['customer', 'service-provider']),
    phone: z.string().optional(),
    locale: z.enum(['en', 'ar']).optional(),
    businessName: z.string().optional(),
    colors: colorsSchema.optional(),
  })
  // Contract: a provider names its business; customers must not.
  .superRefine((data, ctx) => {
    if (data.role === 'service-provider' && !data.businessName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['businessName'],
        message: 'businessName is required for service providers',
      })
    }
  })

const loginSchema = z.object({
  email,
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

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({ user: req.user, branding: await brandingForProvider(req.user!.providerId) })
  } catch (err) {
    handle(err, res)
  }
})

// Public single-brand resolution for the mobile client (the seeded provider).
// Mounted at top-level `/branding` in app.ts.
export const brandingRouter: Router = Router()
brandingRouter.get('/', async (_req, res) => {
  try {
    res.json(await getBranding())
  } catch (err) {
    handle(err, res)
  }
})

const updateBrandingSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().nullable(),
  colors: colorsSchema,
})

// A provider edits its own white-label branding (name, logo, brand colors).
brandingRouter.patch('/', requireAuth, requireRole('service-provider'), async (req, res) => {
  const parsed = updateBrandingSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
    return
  }
  try {
    res.json(await updateBranding(req.user!, parsed.data))
  } catch (err) {
    handle(err, res)
  }
})

function handle(err: unknown, res: Response): void {
  if (err instanceof AuthError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
}
