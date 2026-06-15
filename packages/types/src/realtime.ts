import type { BookingStatus } from './booking'

/**
 * Realtime (Socket.io) contract. The server emits `booking:status` whenever a
 * booking transitions; clients refetch on receipt (the payload only says *what*
 * changed, not the full new state).
 */
export const BOOKING_STATUS_EVENT = 'booking:status'

export interface BookingStatusEvent {
  bookingId: string
  status: BookingStatus
}
