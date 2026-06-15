/**
 * Vehicle return + inspection (end of the keyless flow). The customer initiates
 * the return (`picked-up → returned`); the provider inspects and completes it
 * (`returned → completed`), recording the vehicle's condition.
 */
export type ReturnCondition = 'clean' | 'minor-damage' | 'major-damage'

/** Provider confirms the return after inspecting the vehicle. */
export interface CompleteBookingRequest {
  condition: ReturnCondition
  notes?: string
}

/** Recorded inspection result for a returned booking. */
export interface ReturnInspection {
  bookingId: string
  condition: ReturnCondition
  notes: string | null
  /** ISO 8601 */
  inspectedAt: string
  /** Provider/staff user who performed the inspection. */
  inspectorId: string
}
