import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

const app = createApp()

const CUSTOMER = { email: 'customer@demo.test', password: 'Password123!' }
const PROVIDER = { email: 'provider@demo.test', password: 'Password123!' }
const VEHICLE = 'veh-corolla'
const PICKUP = 'branch-downtown'
const DROPOFF = 'branch-airport'

const DAY = 86_400_000
const RUN_BASE = Date.UTC(2031, 0, 1, 10) + Math.floor(Math.random() * 25_000) * 100 * DAY
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

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** Drive a booking all the way to `completed` (the state rating requires). */
async function completedBooking(): Promise<string> {
  const created = await request(app)
    .post('/bookings')
    .set(bearer(customerToken))
    .send({ vehicleId: VEHICLE, plan: 'daily', pickupBranchId: PICKUP, dropoffBranchId: DROPOFF, ...nextDates() })
  const id = created.body.id as string
  await request(app).post(`/payments/${id}/pay`).set(bearer(customerToken)).send({ method: 'card-mock' })
  await request(app).post(`/bookings/${id}/prepare`).set(bearer(providerToken)).send({})
  const code = (await request(app).post(`/otps/${id}/issue`).set(bearer(providerToken)).send({})).body.otp as string
  await request(app).post('/otps/verify').set(bearer(customerToken)).send({ bookingId: id, vehicleId: VEHICLE, otp: code })
  await request(app).post(`/contracts/${id}/sign`).set(bearer(customerToken)).send({ signerName: 'Demo', consent: true })
  await request(app).post(`/bookings/${id}/return`).set(bearer(customerToken)).send({})
  const done = await request(app).post(`/bookings/${id}/complete`).set(bearer(providerToken)).send({ condition: 'clean' })
  expect(done.body.status).toBe('completed')
  return id
}

/** A booking only as far as `picked-up` (not yet completed). */
async function pickedUpBooking(): Promise<string> {
  const created = await request(app)
    .post('/bookings')
    .set(bearer(customerToken))
    .send({ vehicleId: VEHICLE, plan: 'daily', pickupBranchId: PICKUP, dropoffBranchId: DROPOFF, ...nextDates() })
  const id = created.body.id as string
  await request(app).post(`/payments/${id}/pay`).set(bearer(customerToken)).send({ method: 'card-mock' })
  await request(app).post(`/bookings/${id}/prepare`).set(bearer(providerToken)).send({})
  const code = (await request(app).post(`/otps/${id}/issue`).set(bearer(providerToken)).send({})).body.otp as string
  await request(app).post('/otps/verify').set(bearer(customerToken)).send({ bookingId: id, vehicleId: VEHICLE, otp: code })
  await request(app).post(`/contracts/${id}/sign`).set(bearer(customerToken)).send({ signerName: 'Demo', consent: true })
  return id
}

const rate = (token: string, id: string, body: Record<string, unknown>) =>
  request(app).post(`/bookings/${id}/rating`).set(bearer(token)).send(body)
const getRating = (token: string, id: string) => request(app).get(`/bookings/${id}/rating`).set(bearer(token))

beforeAll(async () => {
  customerToken = await login(CUSTOMER)
  providerToken = await login(PROVIDER)
})

describe('booking — rating', () => {
  it('lets the customer rate a completed booking', async () => {
    const id = await completedBooking()
    const res = await rate(customerToken, id, { vehicleRating: 5, serviceRating: 4, comment: 'great car' })
    expect(res.status).toBe(201)
    expect(res.body.bookingId).toBe(id)
    expect(res.body.vehicleRating).toBe(5)
    expect(res.body.serviceRating).toBe(4)
    expect(res.body.comment).toBe('great car')
  })

  it('exposes the rating to the customer and the owning provider', async () => {
    const id = await completedBooking()
    await rate(customerToken, id, { vehicleRating: 3, serviceRating: 3 })
    expect((await getRating(customerToken, id)).body.vehicleRating).toBe(3)
    expect((await getRating(providerToken, id)).status).toBe(200)
  })

  it('404s reading a rating that does not exist yet', async () => {
    const id = await completedBooking()
    expect((await getRating(customerToken, id)).status).toBe(404)
  })

  it('409s rating a booking that is not completed', async () => {
    const id = await pickedUpBooking()
    expect((await rate(customerToken, id, { vehicleRating: 5, serviceRating: 5 })).status).toBe(409)
  })

  it('409s on a double rating', async () => {
    const id = await completedBooking()
    expect((await rate(customerToken, id, { vehicleRating: 5, serviceRating: 5 })).status).toBe(201)
    expect((await rate(customerToken, id, { vehicleRating: 4, serviceRating: 4 })).status).toBe(409)
  })

  it('400s on an out-of-range score', async () => {
    const id = await completedBooking()
    expect((await rate(customerToken, id, { vehicleRating: 6, serviceRating: 5 })).status).toBe(400)
    expect((await rate(customerToken, id, { vehicleRating: 0, serviceRating: 5 })).status).toBe(400)
  })

  it('400s on a missing score', async () => {
    const id = await completedBooking()
    expect((await rate(customerToken, id, { vehicleRating: 5 })).status).toBe(400)
  })

  it('403s a provider trying to rate', async () => {
    const id = await completedBooking()
    expect((await rate(providerToken, id, { vehicleRating: 5, serviceRating: 5 })).status).toBe(403)
  })

  it('404s a customer rating a booking they do not own', async () => {
    const id = await completedBooking()
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: `rate_cust_${Date.now()}@test.com`, password: 'Password123!', name: 'Other', role: 'customer' })
    expect((await rate(reg.body.token, id, { vehicleRating: 5, serviceRating: 5 })).status).toBe(404)
  })

  it('401s without a token', async () => {
    const id = await completedBooking()
    expect((await request(app).post(`/bookings/${id}/rating`).send({ vehicleRating: 5, serviceRating: 5 })).status).toBe(401)
  })
})
