import { useState } from 'react'
import type { BookingStatus, ReturnCondition } from '@car-rental/types'
import { useCompleteBookingMutation } from '../../store/bookingApi'
import {
  useGetContractQuery,
  useGetInspectionQuery,
  useGetOtpQuery,
  useIssueOtpMutation,
} from '../../store/phase5Api'
import { BookingPhase5Actions } from './BookingPhase5Actions'

/**
 * Per-booking container for the Phase-5 actions. Calls the RTK Query hooks for a
 * single booking (one instance per list row) and feeds the resulting data +
 * handlers into the presentational `BookingPhase5Actions`. Queries are skipped
 * until the relevant status so we don't fire (and 404) on every row:
 * - OTP tracking only once a code has been issued (provider clicked Issue),
 * - contract only after the provider asks to view it,
 * - inspection only for completed bookings.
 */
export function BookingPhase5Container({ id, status }: { id: string; status: BookingStatus }) {
  const [issueOtp, { data: issuedOtp = null, isLoading: issuing }] = useIssueOtpMutation({ fixedCacheKey: id })
  const [otpRequested, setOtpRequested] = useState(false)
  const [contractRequested, setContractRequested] = useState(false)

  const { data: otpSummary = null } = useGetOtpQuery(id, { skip: !otpRequested })
  const { data: contract = null } = useGetContractQuery(id, { skip: !contractRequested })
  const { data: inspection = null } = useGetInspectionQuery(id, { skip: status !== 'completed' })

  const [complete, { isLoading: completing }] = useCompleteBookingMutation()

  const onIssueOtp = async () => {
    await issueOtp(id).unwrap()
    setOtpRequested(true)
  }

  const onComplete = async (condition: ReturnCondition, notes: string) => {
    await complete({ id, body: notes ? { condition, notes } : { condition } }).unwrap()
  }

  return (
    <BookingPhase5Actions
      status={status}
      busy={issuing || completing}
      issuedOtp={issuedOtp}
      otpSummary={otpSummary}
      contract={contract}
      inspection={inspection}
      onIssueOtp={onIssueOtp}
      onViewContract={() => setContractRequested(true)}
      onComplete={onComplete}
    />
  )
}
