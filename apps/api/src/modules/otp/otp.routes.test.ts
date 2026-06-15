import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'
import { prisma } from '../../db/prisma'

const app = createApp()

// Seeded demo tenant (apps/api/prisma/seed.ts).
const CUSTOMER = { email: 'customer@demo.test', password: 'Password123!' }
const PROVIDER = { email: 'provider@demo.test', password: 'Password123!' }
const VEHICLE = 'veh-corolla'
const PICKUP = 'branch-downtown'
const DROPOFF = 'branch-airport'

// Non-overlapping windows so re-runs against the persistent test DB never collide.
const DAY = 86_400_000
const RUN_BASE = Date.UTC(2028, 0, 1, 10) + Math.floor(Math.random() * 25_000) * 100 * DAY
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

/** Drive a fresh booking all the way to `vehicle-prepared` (the state OTP issuance requires). */
async function preparedBooking(): Promise<string> {
  const created = await request(app)
    .post('/bookings')
    .set(bearer(customerToken))
    .send({ vehicleId: VEHICLE, plan: 'daily', pickupBranchId: PICKUP, dropoffBranchId: DROPOFF, ...nextDates() })
  expect(created.status).toBe(201)
  const id = created.body.id as string

  expect((await request(app).post(`/payments/${id}/pay`).set(bearer(customerToken)).send({ method: 'card-mock' })).status).toBe(201)
  expect((await request(app).post(`/bookings/${id}/prepare`).set(bearer(providerToken)).send({})).status).toBe(200)
  return id
}

function issue(token: string, bookingId: string) {
  return request(app).post(`/otps/${bookingId}/issue`).set(bearer(token)).send({})
}

function verify(token: string, body: Record<string, unknown>) {
  return request(app).post('/otps/verify').set(bearer(token)).send(body)
}

beforeAll(async () => {
  customerToken = await login(CUSTOMER)
  providerToken = await login(PROVIDER)
})

describe('otp — issuance', () => {
  it('provider issues an OTP for a vehicle-prepared booking, bound to booking + vehicle', async () => {
    const bookingId = await preparedBooking()
    const res = await issue(providerToken, bookingId)
    expect(res.status).toBe(201)
    expect(res.body.bookingId).toBe(bookingId)
    expect(res.body.vehicleId).toBe(VEHICLE)
    expect(res.body.otp).toMatch(/^\d{6}$/)
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('does not persist the OTP in plaintext (only a hash is stored)', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    const row = await prisma.otp.findFirst({ where: { bookingId } })
    expect(row).not.toBeNull()
    expect(row!.codeHash).not.toBe(code)
    expect(row!.codeHash.length).toBeGreaterThan(20)
  })

  it('409s when the booking is not yet vehicle-prepared', async () => {
    const created = await request(app)
      .post('/bookings')
      .set(bearer(customerToken))
      .send({ vehicleId: VEHICLE, plan: 'daily', pickupBranchId: PICKUP, dropoffBranchId: DROPOFF, ...nextDates() })
    const res = await issue(providerToken, created.body.id)
    expect(res.status).toBe(409)
  })

  it('404s for a booking outside the provider tenancy', async () => {
    const bookingId = await preparedBooking()
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: `otp_prov_${Date.now()}@test.com`, password: 'Password123!', name: 'Other Provider', role: 'service-provider', businessName: 'Other Rentals' })
    const res = await issue(reg.body.token, bookingId)
    expect(res.status).toBe(404)
  })

  it('403s a customer trying to issue', async () => {
    const bookingId = await preparedBooking()
    expect((await issue(customerToken, bookingId)).status).toBe(403)
  })

  it('401s without a token', async () => {
    const bookingId = await preparedBooking()
    expect((await request(app).post(`/otps/${bookingId}/issue`).send({})).status).toBe(401)
  })

  it('re-issuing invalidates the prior code', async () => {
    const bookingId = await preparedBooking()
    const first = (await issue(providerToken, bookingId)).body.otp as string
    const second = (await issue(providerToken, bookingId)).body.otp as string

    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: first })).body.valid).toBe(false)
    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: second })).body.valid).toBe(true)
  })
})

describe('otp — verification (binding / expiry / consume)', () => {
  it('verifies the correct code for the bound vehicle', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    const res = await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: code })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(true)
  })

  it('rejects a correct code presented for the wrong vehicle (binding)', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    const res = await verify(customerToken, { bookingId, vehicleId: 'veh-not-this-one', otp: code })
    expect(res.body.valid).toBe(false)
  })

  it('rejects a wrong code', async () => {
    const bookingId = await preparedBooking()
    await issue(providerToken, bookingId)
    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: '000000' })).body.valid).toBe(false)
  })

  it('consumes the OTP — a second verify of the same code fails (one-time use)', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: code })).body.valid).toBe(true)
    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: code })).body.valid).toBe(false)
  })

  it('rejects an expired OTP', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    // Simulate the validity window elapsing.
    await prisma.otp.updateMany({ where: { bookingId, consumedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: code })).body.valid).toBe(false)
  })

  it('locks the OTP after too many wrong attempts (rate-limit)', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    for (let i = 0; i < 5; i++) {
      expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: '999999' })).body.valid).toBe(false)
    }
    // Even the correct code no longer works once locked.
    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: code })).body.valid).toBe(false)
  })

  it('404s when verifying a booking the customer does not own', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: `otp_cust_${Date.now()}@test.com`, password: 'Password123!', name: 'Other Customer', role: 'customer' })
    const res = await verify(reg.body.token, { bookingId, vehicleId: VEHICLE, otp: code })
    expect(res.status).toBe(404)
  })

  it('403s a provider trying to verify', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string
    expect((await verify(providerToken, { bookingId, vehicleId: VEHICLE, otp: code })).status).toBe(403)
  })

  it('400s on a missing field', async () => {
    const bookingId = await preparedBooking()
    await issue(providerToken, bookingId)
    expect((await verify(customerToken, { bookingId, vehicleId: VEHICLE })).status).toBe(400)
  })
})

describe('otp — provider tracking', () => {
  it('reports status issued → consumed and never exposes the code', async () => {
    const bookingId = await preparedBooking()
    const code = (await issue(providerToken, bookingId)).body.otp as string

    const issued = await request(app).get(`/otps/${bookingId}`).set(bearer(providerToken))
    expect(issued.status).toBe(200)
    expect(issued.body.status).toBe('issued')
    expect(issued.body.bookingId).toBe(bookingId)
    expect(JSON.stringify(issued.body)).not.toContain(code)

    await verify(customerToken, { bookingId, vehicleId: VEHICLE, otp: code })
    const consumed = await request(app).get(`/otps/${bookingId}`).set(bearer(providerToken))
    expect(consumed.body.status).toBe('consumed')
  })

  it('404s tracking a booking with no OTP yet', async () => {
    const bookingId = await preparedBooking()
    expect((await request(app).get(`/otps/${bookingId}`).set(bearer(providerToken))).status).toBe(404)
  })
})
