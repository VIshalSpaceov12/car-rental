import { validateDraft, toQuoteRequest, toCreateRequest, type BookingDraft } from './bookingDraft'

const valid: BookingDraft = {
  vehicleId: 'veh-corolla',
  plan: 'daily',
  startDate: '2026-07-01',
  endDate: '2026-07-04',
  pickupBranchId: 'branch-downtown',
  dropoffBranchId: 'branch-airport',
  discountCode: '',
}

describe('validateDraft', () => {
  it('passes a complete draft', () => {
    expect(validateDraft(valid)).toBeNull()
  })

  it('requires a vehicle', () => {
    expect(validateDraft({ ...valid, vehicleId: null })).toMatch(/vehicle/i)
  })

  it('requires start and end dates', () => {
    expect(validateDraft({ ...valid, endDate: '' })).toMatch(/date/i)
  })

  it('rejects an end on or before the start', () => {
    expect(validateDraft({ ...valid, endDate: '2026-07-01' })).toMatch(/after/i)
  })

  it('requires both branches', () => {
    expect(validateDraft({ ...valid, dropoffBranchId: null })).toMatch(/branch/i)
  })
})

describe('toQuoteRequest / toCreateRequest', () => {
  it('maps a draft to a quote request with ISO dates', () => {
    const q = toQuoteRequest(valid)
    expect(q.vehicleId).toBe('veh-corolla')
    expect(q.plan).toBe('daily')
    expect(q.startAt).toBe('2026-07-01T10:00:00.000Z')
    expect(q.endAt).toBe('2026-07-04T10:00:00.000Z')
    expect(q.discountCode).toBeUndefined()
  })

  it('includes a non-empty discount code', () => {
    expect(toQuoteRequest({ ...valid, discountCode: 'welcome10' }).discountCode).toBe('welcome10')
  })

  it('maps a draft to a create request with branches', () => {
    const c = toCreateRequest(valid)
    expect(c.pickupBranchId).toBe('branch-downtown')
    expect(c.dropoffBranchId).toBe('branch-airport')
    expect(c.startAt).toBe('2026-07-01T10:00:00.000Z')
  })
})
