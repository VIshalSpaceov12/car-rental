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

// Non-overlapping windows so re-runs against the persistent test DB never collide
// (mirrors booking.routes.test.ts).
const DAY = 86_400_000
const RUN_BASE = Date.UTC(2027, 0, 1, 10) + Math.floor(Math.random() * 25_000) * 100 * DAY
let windowCursor = 0
function nextDates() {
  const base = RUN_BASE + windowCursor * 4 * DAY
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

function pay(token: string, bookingId: string, body: Record<string, unknown>) {
  return request(app).post(`/payments/${bookingId}/pay`).set(bearer(token)).send(body)
}

/** Fetch the customer's view of a booking from the list (carries paymentStatus). */
async function summaryOf(bookingId: string) {
  const res = await request(app).get('/bookings').set(bearer(customerToken))
  expect(res.status).toBe(200)
  return res.body.find((b: { id: string }) => b.id === bookingId)
}

beforeAll(async () => {
  customerToken = await login(CUSTOMER)
  providerToken = await login(PROVIDER)
})

describe('payments — pay a reserved booking', () => {
  it('card-mock success → payment paid + booking confirmed', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await pay(customerToken, booking.id, { method: 'card-mock' })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('paid')
    expect(res.body.method).toBe('card-mock')
    expect(res.body.amount).toBe(378)
    expect(res.body.bookingId).toBe(booking.id)
    expect(res.body.gatewayRef).toBe(`mock_${booking.id}`)

    const summary = await summaryOf(booking.id)
    expect(summary.status).toBe('confirmed')
    expect(summary.paymentStatus).toBe('paid')
  })

  it('cash-on-delivery → payment pending + booking confirmed (settled at pickup)', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await pay(customerToken, booking.id, { method: 'cash-on-delivery' })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('pending')
    expect(res.body.method).toBe('cash-on-delivery')
    expect(res.body.gatewayRef).toBeNull()

    const summary = await summaryOf(booking.id)
    expect(summary.status).toBe('confirmed')
    expect(summary.paymentStatus).toBe('pending')
  })

  it('card-mock + simulateFailure → payment failed, booking stays reserved', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await pay(customerToken, booking.id, { method: 'card-mock', simulateFailure: true })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('failed')
    expect(res.body.gatewayRef).toBeNull()

    const summary = await summaryOf(booking.id)
    expect(summary.status).toBe('reserved')
    expect(summary.paymentStatus).toBe('failed')
  })

  it('lets a customer retry after a failed payment (failed does not block)', async () => {
    const { body: booking } = await createBooking(customerToken)
    const failed = await pay(customerToken, booking.id, { method: 'card-mock', simulateFailure: true })
    expect(failed.body.status).toBe('failed')

    const retry = await pay(customerToken, booking.id, { method: 'card-mock' })
    expect(retry.status).toBe(201)
    expect(retry.body.status).toBe('paid')

    const summary = await summaryOf(booking.id)
    expect(summary.status).toBe('confirmed')
    expect(summary.paymentStatus).toBe('paid')
  })
})

describe('payments — guards', () => {
  it('409s when paying for a non-reserved (already confirmed) booking', async () => {
    const { body: booking } = await createBooking(customerToken)
    expect((await pay(customerToken, booking.id, { method: 'card-mock' })).status).toBe(201)

    const again = await pay(customerToken, booking.id, { method: 'cash-on-delivery' })
    expect(again.status).toBe(409)
  })

  it('409s on double-pay (a live payment blocks a second one)', async () => {
    const { body: booking } = await createBooking(customerToken)
    expect((await pay(customerToken, booking.id, { method: 'cash-on-delivery' })).status).toBe(201)

    const dup = await pay(customerToken, booking.id, { method: 'cash-on-delivery' })
    expect(dup.status).toBe(409)
  })

  it('404s when paying for another customer’s booking', async () => {
    const { body: booking } = await createBooking(customerToken)

    const reg = await request(app)
      .post('/auth/register')
      .send({
        email: `other_cust_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'Other Customer',
        role: 'customer',
      })
    const otherToken: string = reg.body.token

    const res = await pay(otherToken, booking.id, { method: 'card-mock' })
    expect(res.status).toBe(404)
  })

  it('403s a provider trying to pay', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await pay(providerToken, booking.id, { method: 'card-mock' })
    expect(res.status).toBe(403)
  })

  it('401s without a token', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await request(app).post(`/payments/${booking.id}/pay`).send({ method: 'card-mock' })
    expect(res.status).toBe(401)
  })

  it('400s on an invalid method', async () => {
    const { body: booking } = await createBooking(customerToken)
    const res = await pay(customerToken, booking.id, { method: 'bitcoin' })
    expect(res.status).toBe(400)
  })
})

describe('payments — refund on cancel', () => {
  it('marks a paid payment refunded when the customer cancels', async () => {
    const { body: booking } = await createBooking(customerToken)
    expect((await pay(customerToken, booking.id, { method: 'card-mock' })).status).toBe(201)

    const cancelled = await request(app).post(`/bookings/${booking.id}/cancel`).set(bearer(customerToken))
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.status).toBe('cancelled')

    const summary = await summaryOf(booking.id)
    expect(summary.paymentStatus).toBe('refunded')
  })

  it('marks a paid payment refunded when the provider cancels', async () => {
    const { body: booking } = await createBooking(customerToken)
    expect((await pay(customerToken, booking.id, { method: 'card-mock' })).status).toBe(201)

    const cancelled = await request(app).post(`/bookings/${booking.id}/provider-cancel`).set(bearer(providerToken))
    expect(cancelled.status).toBe(200)

    const summary = await summaryOf(booking.id)
    expect(summary.paymentStatus).toBe('refunded')
  })
})

describe('payments — BookingSummary.paymentStatus', () => {
  it('is null for a booking that has never been paid', async () => {
    const { body: booking } = await createBooking(customerToken)
    const summary = await summaryOf(booking.id)
    expect(summary.paymentStatus).toBeNull()
  })
})
