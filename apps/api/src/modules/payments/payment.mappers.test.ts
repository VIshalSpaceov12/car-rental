import { describe, it, expect } from 'vitest'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@car-rental/types'
import {
  METHOD_TO_DB,
  METHOD_TO_WIRE,
  PAYMENT_STATUS_TO_DB,
  PAYMENT_STATUS_TO_WIRE,
} from './payment.mappers'

describe('payment enum mappers', () => {
  it('round-trips every PaymentMethod wire ↔ db', () => {
    for (const method of PAYMENT_METHODS) {
      expect(METHOD_TO_WIRE[METHOD_TO_DB[method]]).toBe(method)
    }
  })

  it('round-trips every PaymentStatus wire ↔ db', () => {
    for (const status of PAYMENT_STATUSES) {
      expect(PAYMENT_STATUS_TO_WIRE[PAYMENT_STATUS_TO_DB[status]]).toBe(status)
    }
  })

  it('maps kebab/lowercase wire to UPPER_SNAKE db', () => {
    expect(METHOD_TO_DB['card-mock']).toBe('CARD_MOCK')
    expect(METHOD_TO_DB['cash-on-delivery']).toBe('CASH_ON_DELIVERY')
    expect(PAYMENT_STATUS_TO_DB.pending).toBe('PENDING')
    expect(PAYMENT_STATUS_TO_DB.refunded).toBe('REFUNDED')
  })
})
