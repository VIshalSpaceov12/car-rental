/**
 * Post-rental rating. A customer rates the vehicle and the service (1–5 each)
 * once a booking is `completed`. One rating per booking.
 */
export interface Rating {
  bookingId: string
  /** 1–5 */
  vehicleRating: number
  /** 1–5 */
  serviceRating: number
  comment: string | null
  /** ISO 8601 */
  createdAt: string
}

export interface CreateRatingRequest {
  /** 1–5 */
  vehicleRating: number
  /** 1–5 */
  serviceRating: number
  comment?: string
}
