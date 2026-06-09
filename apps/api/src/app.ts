import express, { type Express } from 'express'
import cors from 'cors'
import { healthRouter } from './modules/health/health.routes'
import {
  branchesRouter,
  categoriesRouter,
  vehiclesRouter,
} from './modules/fleet/fleet.routes'
import { authRouter } from './modules/auth/auth.routes'
import { bookingsRouter } from './modules/bookings/booking.routes'

/**
 * Modular monolith: one Express app, domain modules mounted as routers.
 * Each module (auth, bookings, payments, fleet, notifications) owns its
 * routes/services and can be extracted to its own service later.
 */
export function createApp(): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use('/health', healthRouter)
  app.use('/auth', authRouter)
  app.use('/vehicles', vehiclesRouter)
  app.use('/categories', categoriesRouter)
  app.use('/branches', branchesRouter)
  app.use('/bookings', bookingsRouter)

  return app
}
