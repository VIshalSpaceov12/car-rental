import type { RentalPlan } from '@car-rental/types'

export interface ContractContentInput {
  bookingId: string
  vehicleName: string
  plan: RentalPlan
  /** ISO 8601 */
  startAt: string
  /** ISO 8601 */
  endAt: string
  total: number
  currency: string
}

/**
 * Render the rental agreement text from a booking. Pure + deterministic so the
 * same booking always yields the same contract (and it is testable without a DB).
 */
export function buildContractContent(input: ContractContentInput): string {
  const start = input.startAt.slice(0, 10)
  const end = input.endAt.slice(0, 10)
  return [
    'RENTAL AGREEMENT',
    '',
    `Booking reference: ${input.bookingId}`,
    `Vehicle: ${input.vehicleName}`,
    `Rental plan: ${input.plan}`,
    `Rental period: ${start} to ${end}`,
    `Total payable: ${input.total} ${input.currency}`,
    '',
    'TERMS',
    '1. The renter is responsible for the vehicle for the full rental period.',
    '2. Vehicle access is granted via a one-time OTP lock-box code.',
    '3. The vehicle must be returned to the agreed branch in the condition received.',
    '4. By signing, the renter accepts these terms and confirms the details above.',
  ].join('\n')
}
