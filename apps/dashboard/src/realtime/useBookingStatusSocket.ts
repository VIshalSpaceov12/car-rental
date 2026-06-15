import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { BOOKING_STATUS_EVENT } from '@car-rental/types'
import { API_URL } from '../api/config'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { bookingApi } from '../store/bookingApi'

/**
 * Opens ONE authenticated Socket.io connection for the logged-in provider and
 * keeps the live booking board in sync. On every `booking:status` event we
 * invalidate the `Booking` tag so the RTK Query board refetches the new state
 * (the payload only says *what* changed, not the full booking).
 *
 * Mounted in the authed layout (not a leaf component) so there's a single
 * connection per session, and so unit tests that render leaf components never
 * try to open a socket. The effect is a no-op while logged out (no token), and
 * disconnects on logout/unmount.
 */
export function useBookingStatusSocket(): void {
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
  }, [token, dispatch])
}
