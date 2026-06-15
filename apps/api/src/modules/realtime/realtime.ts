import type { Server as HttpServer } from 'node:http'
import { Server, type Socket } from 'socket.io'
import { BOOKING_STATUS_EVENT, type BookingStatus, type BookingStatusEvent } from '@car-rental/types'
import { verifyToken } from '../auth/auth.jwt'
import { getUserById } from '../auth/auth.service'
import { toAuthUser } from '../auth/auth.mappers'

// Single io instance for the process. Null until the server boots (or in test
// suites that never call initRealtime), which makes emitBookingStatus a no-op —
// realtime is best-effort and never blocks the REST path.
let io: Server | null = null

/**
 * Attach Socket.io to the HTTP server. Connections authenticate with the same JWT
 * as REST (via the handshake `auth.token`); an authenticated socket joins its
 * `user:<id>` room (and `provider:<providerId>` for providers) so status pushes
 * reach only the parties to a booking.
 */
export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, { cors: { origin: '*' } })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (typeof token !== 'string') {
      next(new Error('unauthorized'))
      return
    }
    try {
      const payload = verifyToken(token)
      const user = await getUserById(payload.sub)
      if (!user) {
        next(new Error('unauthorized'))
        return
      }
      socket.data.user = toAuthUser(user)
      next()
    } catch {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user
    socket.join(`user:${user.id}`)
    if (user.providerId) socket.join(`provider:${user.providerId}`)
  })

  return io
}

/** Best-effort broadcast of a booking status change to the customer + provider. */
export function emitBookingStatus(args: {
  bookingId: string
  status: BookingStatus
  customerId: string
  providerId: string
}): void {
  if (!io) return
  const payload: BookingStatusEvent = { bookingId: args.bookingId, status: args.status }
  io.to(`user:${args.customerId}`).to(`provider:${args.providerId}`).emit(BOOKING_STATUS_EVENT, payload)
}

/** Tear down the io instance (tests / graceful shutdown). */
export function closeRealtime(): void {
  io?.close()
  io = null
}
