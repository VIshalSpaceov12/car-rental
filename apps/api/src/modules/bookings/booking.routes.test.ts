import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

const app = createApp()

// Seeded demo tenant (apps/api/prisma/seed.ts).
const CUSTOMER = { email: 'customer@demo.test', password: 'Password123!' }
const PROVIDER = { email: 'provider@demo.test', password: 'Password123!' }
const VEHICLE = 'veh-corolla' // economy, 120/day AED, provider "demo-provider"
const PICKUP = 'branch-downtown'
const DROPOFF = 'branch-airport'

const DATES = { startAt: '2026-07-01T10:00:00.000Z', endAt: '2026-07-04T10:00:00.000Z' } // 3 days

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
    .send({ vehicleId: VEHICLE, plan: 'daily', pickupBranchId: PICKUP, dropoffBranchId: DROPOFF, ...DATES, ...overrides })
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
    expect(res.body.subtotal).toBe(360)
    expect(res.body.tax).toBe(18)
    expect(res.body.total).toBe(378)
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
    expect(res.body.total).toBe(378)
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
  it('runs accept then prepare: reserved → confirmed → vehicle-prepared', async () => {
    const { body: booking } = await createBooking(customerToken)

    const accepted = await request(app).post(`/bookings/${booking.id}/accept`).set(bearer(providerToken))
    expect(accepted.status).toBe(200)
    expect(accepted.body.status).toBe('confirmed')

    const prepared = await request(app).post(`/bookings/${booking.id}/prepare`).set(bearer(providerToken))
    expect(prepared.status).toBe(200)
    expect(prepared.body.status).toBe('vehicle-prepared')
  })

  it('rejects an illegal transition (prepare while reserved) with 409', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await request(app).post(`/bookings/${booking.id}/prepare`).set(bearer(providerToken))
    expect(res.status).toBe(409)
  })

  it('rejects accepting an already-confirmed booking with 409', async () => {
    const { body: booking } = await createBooking(customerToken)
    await request(app).post(`/bookings/${booking.id}/accept`).set(bearer(providerToken))
    const again = await request(app).post(`/bookings/${booking.id}/accept`).set(bearer(providerToken))
    expect(again.status).toBe(409)
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
  it('forbids a customer from accepting a booking (403)', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await request(app).post(`/bookings/${booking.id}/accept`).set(bearer(customerToken))
    expect(res.status).toBe(403)
  })

  it('hides another provider’s booking from a different tenant (404 on accept)', async () => {
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

    const res = await request(app).post(`/bookings/${booking.id}/accept`).set(bearer(otherToken))
    expect(res.status).toBe(404)
  })
})
