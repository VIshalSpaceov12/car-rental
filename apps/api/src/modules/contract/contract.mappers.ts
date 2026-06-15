import type { Contract as DbContract } from '@prisma/client'
import type { Contract } from '@car-rental/types'

/** Map a Contract row to the wire contract: Date→ISO. */
export function toWireContract(c: DbContract): Contract {
  return {
    bookingId: c.bookingId,
    content: c.content,
    signedAt: c.signedAt ? c.signedAt.toISOString() : null,
    signerName: c.signerName,
    signedConsent: c.signedConsent,
  }
}
