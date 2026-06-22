import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

const app = createApp()

// Seeded demo tenant (apps/api/prisma/seed.ts).
const CUSTOMER = { email: 'customer@demo.test', password: 'Password123!' }
const PROVIDER = { email: 'provider@demo.test', password: 'Password123!' }
const VEHICLE = 'veh-corolla' // BMW M4, 900/day AED, provider "demo-provider"
const PICKUP = 'branch-downtown'
const DROPOFF = 'branch-airport'

const DATES = { startAt: '2026-07-01T10:00:00.000Z', endAt: '2026-07-04T10:00:00.000Z' } // 3 days

// The overlap guard forbids double-booking the same vehicle/range. Each
// helper-created booking gets its own 3-day window with a 4-day stride. Each run
// picks a random base band (years from 2027) so re-runs against the persistent
// test DB never collide with a prior run's bookings.
const DAY = 86_400_000
// Random band within ~2027–9000 (4-digit year, so the ISO string stays datetime-valid).
const RUN_BASE = Date.UTC(2027, 0, 1, 10) + Math.floor(Math.random() * 25_000) * 100 * DAY
let windowCursor = 0
function nextDates() {
  const base = RUN_BASE + windowCursor * 4 * DAY // 4-day stride, no overlap
  windowCursor += 1
  return { startAt: new Date(base).toISOString(), endAt: new Date(base + 3 * DAY).toISOString() }
}

let customerToken: string
let providerToken: string

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await request(app).post('/auth/login').send(creds)
  expect(res.status).toBe(200)
  return res.body.token
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` }
}

async function createBooking(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/bookings')
    .set(bearer(token))
    .send({
      vehicleId: VEHICLE,
      plan: 'daily',
      pickupBranchId: PICKUP,
      dropoffBranchId: DROPOFF,
      ...nextDates(),
      ...overrides,
    })
}

beforeAll(async () => {
  customerToken = await login(CUSTOMER)
  providerToken = await login(PROVIDER)
})

describe('bookings — quote', () => {
  it('returns an itemized quote for a seeded vehicle', async () => {
    const res = await request(app)
      .post('/bookings/quote')
      .set(bearer(customerToken))
      .send({ vehicleId: VEHICLE, plan: 'daily', ...DATES })
    expect(res.status).toBe(200)
    expect(res.body.days).toBe(3)
    expect(res.body.subtotal).toBe(2700)
    expect(res.body.tax).toBe(135)
    expect(res.body.total).toBe(2835)
    expect(res.body.currency).toBe('AED')
  })

  it('requires auth (401 without a token)', async () => {
    const res = await request(app)
      .post('/bookings/quote')
      .send({ vehicleId: VEHICLE, plan: 'daily', ...DATES })
    expect(res.status).toBe(401)
  })

  it('404s for an unknown vehicle', async () => {
    const res = await request(app)
      .post('/bookings/quote')
      .set(bearer(customerToken))
      .send({ vehicleId: 'no-such-vehicle', plan: 'daily', ...DATES })
    expect(res.status).toBe(404)
  })
})

describe('bookings — branch options', () => {
  it('lists the branches of the vehicle’s provider', async () => {
    const res = await request(app).get(`/bookings/vehicles/${VEHICLE}/branches`).set(bearer(customerToken))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    const ids = res.body.map((b: { id: string }) => b.id)
    expect(ids).toContain(PICKUP)
    expect(ids).toContain(DROPOFF)
    expect(res.body.every((b: { id: string; name: string }) => typeof b.name === 'string')).toBe(true)
  })

  it('404s branch options for an unknown vehicle', async () => {
    const res = await request(app).get('/bookings/vehicles/no-such-vehicle/branches').set(bearer(customerToken))
    expect(res.status).toBe(404)
  })
})

describe('bookings — create', () => {
  it('creates a reserved booking with server-computed totals', async () => {
    const res = await createBooking(customerToken)
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('reserved')
    expect(res.body.providerId).toBe('demo-provider')
    expect(res.body.vehicleId).toBe(VEHICLE)
    expect(res.body.total).toBe(2835)
    expect(typeof res.body.id).toBe('string')
  })

  it('rejects end-before-start with 400', async () => {
    const res = await createBooking(customerToken, {
      startAt: '2026-07-04T10:00:00.000Z',
      endAt: '2026-07-01T10:00:00.000Z',
    })
    expect(res.status).toBe(400)
  })

  it('rejects a branch that does not belong to the vehicle provider (400)', async () => {
    const res = await createBooking(customerToken, { pickupBranchId: 'no-such-branch' })
    expect(res.status).toBe(400)
  })

  it('forbids a provider from creating a booking (403)', async () => {
    const res = await createBooking(providerToken)
    expect(res.status).toBe(403)
  })

  it('rejects a startAt in the past with 400', async () => {
    const res = await createBooking(customerToken, {
      startAt: '2020-01-01T10:00:00.000Z',
      endAt: '2020-01-04T10:00:00.000Z',
    })
    expect(res.status).toBe(400)
  })
})

describe('bookings — availability & overlap', () => {
  // veh-sunny belongs to the demo provider; toggle its availability via the fleet API.
  const SUNNY = 'veh-sunny'
  const setAvailable = (available: boolean) =>
    request(app).patch(`/vehicles/${SUNNY}`).set(bearer(providerToken)).send({ available })

  it('409s when booking a vehicle marked unavailable', async () => {
    const off = await setAvailable(false)
    expect(off.status).toBe(200)
    try {
      const res = await createBooking(customerToken, { vehicleId: SUNNY })
      expect(res.status).toBe(409)
    } finally {
      await setAvailable(true)
    }
  })

  it('409s when a date range overlaps an existing booking on the same vehicle', async () => {
    const window = nextDates()
    const first = await createBooking(customerToken, { vehicleId: SUNNY, ...window })
    expect(first.status).toBe(201)

    // Same range → overlap.
    const dup = await createBooking(customerToken, { vehicleId: SUNNY, ...window })
    expect(dup.status).toBe(409)

    // A cancelled booking frees the vehicle: cancel the first, then the range books.
    const cancelled = await request(app).post(`/bookings/${first.body.id}/cancel`).set(bearer(customerToken))
    expect(cancelled.status).toBe(200)
    const reused = await createBooking(customerToken, { vehicleId: SUNNY, ...window })
    expect(reused.status).toBe(201)
  })
})

describe('bookings — list scoping', () => {
  it('returns only the caller’s bookings for a customer', async () => {
    const created = await createBooking(customerToken)
    const res = await request(app).get('/bookings').set(bearer(customerToken))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.some((b: { id: string }) => b.id === created.body.id)).toBe(true)
    expect(res.body.every((b: { customerId: string }) => typeof b.customerId === 'string')).toBe(true)
  })

  it('returns the provider’s incoming bookings with display names', async () => {
    const created = await createBooking(customerToken)
    const res = await request(app).get('/bookings').set(bearer(providerToken))
    expect(res.status).toBe(200)
    const found = res.body.find((b: { id: string }) => b.id === created.body.id)
    expect(found).toBeDefined()
    expect(found.providerId).toBe('demo-provider')
    expect(typeof found.vehicleName).toBe('string')
    expect(typeof found.customerName).toBe('string')
    expect(res.body.every((b: { providerId: string }) => b.providerId === 'demo-provider')).toBe(true)
  })
})

describe('bookings — guarded lifecycle', () => {
  it('runs pay then prepare: reserved → confirmed → vehicle-prepared', async () => {
    const { body: booking } = await createBooking(customerToken)

    // Confirmation is now driven by payment, not a manual provider accept.
    const paid = await request(app)
      .post(`/payments/${booking.id}/pay`)
      .set(bearer(customerToken))
      .send({ method: 'card-mock' })
    expect(paid.status).toBe(201)

    const prepared = await request(app).post(`/bookings/${booking.id}/prepare`).set(bearer(providerToken))
    expect(prepared.status).toBe(200)
    expect(prepared.body.status).toBe('vehicle-prepared')
  })

  it('rejects an illegal transition (prepare while reserved) with 409', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await request(app).post(`/bookings/${booking.id}/prepare`).set(bearer(providerToken))
    expect(res.status).toBe(409)
  })

  it('lets a provider reject a reserved booking (reserved → rejected)', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await request(app).post(`/bookings/${booking.id}/reject`).set(bearer(providerToken))
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('rejected')
  })

  it('lets a customer cancel a reserved booking (reserved → cancelled)', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await request(app).post(`/bookings/${booking.id}/cancel`).set(bearer(customerToken))
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })
})

describe('bookings — authorization', () => {
  it('forbids a customer from rejecting a booking (403)', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await request(app).post(`/bookings/${booking.id}/reject`).set(bearer(customerToken))
    expect(res.status).toBe(403)
  })

  it('hides another provider’s booking from a different tenant (404 on reject)', async () => {
    const { body: booking } = await createBooking(customerToken)

    // A freshly registered provider is a different tenant and must not see it.
    const reg = await request(app)
      .post('/auth/register')
      .send({
        email: `other_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'Other Provider',
        role: 'service-provider',
        businessName: 'Other Rentals',
      })
    const otherToken: string = reg.body.token

    const res = await request(app).post(`/bookings/${booking.id}/reject`).set(bearer(otherToken))
    expect(res.status).toBe(404)
  })
})

describe('bookings — provider cancel & prepare timestamp', () => {
  it('lets the owning provider cancel a confirmed booking (confirmed → cancelled)', async () => {
    const { body: booking } = await createBooking(customerToken)
    const paid = await request(app)
      .post(`/payments/${booking.id}/pay`)
      .set(bearer(customerToken))
      .send({ method: 'card-mock' })
    expect(paid.status).toBe(201)

    const cancelled = await request(app).post(`/bookings/${booking.id}/provider-cancel`).set(bearer(providerToken))
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.status).toBe('cancelled')
  })

  it('forbids a customer from using provider-cancel (403); customer /cancel still works', async () => {
    const { body: a } = await createBooking(customerToken)
    const forbidden = await request(app).post(`/bookings/${a.id}/provider-cancel`).set(bearer(customerToken))
    expect(forbidden.status).toBe(403)

    const { body: b } = await createBooking(customerToken)
    const ok = await request(app).post(`/bookings/${b.id}/cancel`).set(bearer(customerToken))
    expect(ok.status).toBe(200)
    expect(ok.body.status).toBe('cancelled')
  })

  it('persists prepReadyAt when the provider prepares the vehicle', async () => {
    const { body: booking } = await createBooking(customerToken)
    await request(app).post(`/payments/${booking.id}/pay`).set(bearer(customerToken)).send({ method: 'card-mock' })

    const prepReadyAt = '2027-12-01T09:00:00.000Z'
    const prepared = await request(app)
      .post(`/bookings/${booking.id}/prepare`)
      .set(bearer(providerToken))
      .send({ prepReadyAt })
    expect(prepared.status).toBe(200)
    expect(prepared.body.status).toBe('vehicle-prepared')
    expect(prepared.body.prepReadyAt).toBe(prepReadyAt)
  })
})
