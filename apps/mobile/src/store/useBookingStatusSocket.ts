import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { BOOKING_STATUS_EVENT } from '@car-rental/types'
import { API_URL } from '../api'
import { bookingApi } from './bookingApi'
import { useAppDispatch, useAppSelector } from './hooks'

/**
 * Phase 6 — live booking status. Opens ONE authenticated Socket.io connection
 * while the customer is logged in and refetches the bookings list whenever the
 * server reports a transition. The payload only names what changed, so we
 * invalidate the `Booking` tag and let RTK Query pull the fresh state.
 *
 * Mount this in the authed navigator (not in a leaf component) so it lives for
 * the whole session and unit tests that render screens never open a real socket.
 */
export function useBookingStatusSocket() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)

  useEffect(() => {
    if (!token) return

    const socket = io(API_URL, { auth: { token } })

    socket.on(BOOKING_STATUS_EVENT, () => {
      dispatch(bookingApi.util.invalidateTags(['Booking']))
    })

    return () => {
      socket.off(BOOKING_STATUS_EVENT)
      socket.disconnect()
    }
  }, [dispatch, token])
}
