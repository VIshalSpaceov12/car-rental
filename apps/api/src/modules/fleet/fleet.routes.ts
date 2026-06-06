import { Router } from 'express'
import { listVehicles } from './fleet.repository'

export const fleetRouter: Router = Router()

// Express 4 doesn't catch async-handler rejections; handle locally for now
// (a generic async error middleware comes in a later phase).
fleetRouter.get('/', async (_req, res) => {
  try {
    res.json(await listVehicles())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to list vehicles' })
  }
})
