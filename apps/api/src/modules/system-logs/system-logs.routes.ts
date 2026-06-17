import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/auth.middleware'
import { clear, query, stats } from '../../logger/log-store'

export const systemLogsRouter: Router = Router()

// The dashboard admin is the service-provider role (no separate admin role yet).
const adminOnly = [requireAuth, requireRole('service-provider')] as const

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  level: z.enum(['error', 'warn', 'info', 'debug']).optional(),
  minutes: z.coerce.number().int().min(1).max(10080).optional(),
})

// Live app/HTTP logs (in-memory), newest-first, with aggregate counts.
systemLogsRouter.get('/', ...adminOnly, (req, res) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid query', details: parsed.error.flatten() })
    return
  }
  res.json({
    logs: query({ limit: parsed.data.limit ?? 100, level: parsed.data.level, minutes: parsed.data.minutes }),
    stats: stats(),
  })
})

systemLogsRouter.get('/stats', ...adminOnly, (_req, res) => {
  res.json(stats())
})

systemLogsRouter.get('/recent', ...adminOnly, (req, res) => {
  const minutes = Number(req.query.minutes) || 30
  res.json({ logs: query({ minutes }), stats: stats() })
})

// Clears the in-memory buffer only (there is no durable store for app logs).
systemLogsRouter.post('/clear', ...adminOnly, (_req, res) => {
  clear()
  res.json({ message: 'logs cleared', clearedAt: new Date().toISOString() })
})
