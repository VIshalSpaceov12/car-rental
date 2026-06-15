import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { healthRouter } from './modules/health/health.routes'
import {
  branchesRouter,
  categoriesRouter,
  providerVehiclesRouter,
  vehiclesRouter,
} from './modules/fleet/fleet.routes'
import { authRouter, brandingRouter } from './modules/auth/auth.routes'
import { bookingsRouter } from './modules/bookings/booking.routes'
import { paymentsRouter } from './modules/payments/payment.routes'
import { otpsRouter } from './modules/otp/otp.routes'
import { contractsRouter } from './modules/contract/contract.routes'

/**
 * Modular monolith: one Express app, domain modules mounted as routers.
 * Each module (auth, bookings, payments, fleet, notifications) owns its
 * routes/services and can be extracted to its own service later.
 */
export function createApp(): Express {
  const app = express()

  // Security headers on every response.
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  // Throttle credential endpoints to blunt brute-force / user-enumeration.
  // Relaxed under test so the suite's many sign-ins don't trip the shared-IP limit.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 10_000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many requests, try again later' },
  })
  app.use('/auth/register', authLimiter)
  app.use('/auth/login', authLimiter)

  app.use('/health', healthRouter)
  app.use('/auth', authRouter)
  app.use('/branding', brandingRouter)
  app.use('/vehicles', vehiclesRouter)
  app.use('/provider', providerVehiclesRouter)
  app.use('/categories', categoriesRouter)
  app.use('/branches', branchesRouter)
  app.use('/bookings', bookingsRouter)
  app.use('/payments', paymentsRouter)
  app.use('/otps', otpsRouter)
  app.use('/contracts', contractsRouter)

  return app
}
