import { BOOKING_TRANSITIONS, type BookingStatus } from '@car-rental/types'

/**
 * True iff `to` is a legal next status from `from`, per the authoritative
 * transition graph in @car-rental/types. Same-state and terminal-state moves
 * are not in the graph, so they correctly return false.
 */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to)
}
