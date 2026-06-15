import { describe, it, expect } from 'vitest'
import { buildContractContent } from './contract.content'

const input = {
  bookingId: 'bk-123',
  vehicleName: 'Toyota Corolla',
  plan: 'daily' as const,
  startAt: '2027-01-01T10:00:00.000Z',
  endAt: '2027-01-04T10:00:00.000Z',
  total: 378,
  currency: 'AED',
}

describe('buildContractContent', () => {
  it('embeds the key rental facts', () => {
    const text = buildContractContent(input)
    expect(text).toContain('bk-123')
    expect(text).toContain('Toyota Corolla')
    expect(text).toContain('daily')
    expect(text).toContain('378')
    expect(text).toContain('AED')
  })

  it('is deterministic for the same booking', () => {
    expect(buildContractContent(input)).toBe(buildContractContent(input))
  })
})
