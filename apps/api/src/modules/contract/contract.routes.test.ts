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
const RUN_BASE = Date.UTC(2029, 0, 1, 10) + Math.floor(Math.random() * 25_000) * 100 * DAY
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

/** Issue + verify the OTP so the lock-box counts as opened (the sign precondition). */
async function unlock(bookingId: string): Promise<void> {
  const code = (await request(app).post(`/otps/${bookingId}/issue`).set(bearer(providerToken)).send({})).body.otp as string
  const res = await request(app).post('/otps/verify').set(bearer(customerToken)).send({ bookingId, vehicleId: VEHICLE, otp: code })
  expect(res.body.valid).toBe(true)
}

function getContract(token: string, bookingId: string) {
  return request(app).get(`/contracts/${bookingId}`).set(bearer(token))
}

function sign(token: string, bookingId: string, body: Record<string, unknown>) {
  return request(app).post(`/contracts/${bookingId}/sign`).set(bearer(token)).send(body)
}

async function statusOf(bookingId: string): Promise<string> {
  const res = await request(app).get('/bookings').set(bearer(customerToken))
  return res.body.find((b: { id: string }) => b.id === bookingId).status
}

beforeAll(async () => {
  customerToken = await login(CUSTOMER)
  providerToken = await login(PROVIDER)
})

describe('contract — fetch', () => {
  it('returns generated, unsigned terms for the customer', async () => {
    const bookingId = await preparedBooking()
    const res = await getContract(customerToken, bookingId)
    expect(res.status).toBe(200)
    expect(res.body.bookingId).toBe(bookingId)
    expect(res.body.content).toContain(bookingId)
    expect(res.body.signedAt).toBeNull()
    expect(res.body.signedConsent).toBe(false)
  })

  it('is visible to the owning provider (dashboard view)', async () => {
    const bookingId = await preparedBooking()
    expect((await getContract(providerToken, bookingId)).status).toBe(200)
  })

  it('404s for a booking the requester does not own', async () => {
    const bookingId = await preparedBooking()
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: `ctr_cust_${Date.now()}@test.com`, password: 'Password123!', name: 'Other', role: 'customer' })
    expect((await getContract(reg.body.token, bookingId)).status).toBe(404)
  })
})

describe('contract — sign drives pickup', () => {
  it('signs after unlock and transitions the booking to picked-up', async () => {
    const bookingId = await preparedBooking()
    await unlock(bookingId)

    const res = await sign(customerToken, bookingId, { signerName: 'Demo Customer', consent: true })
    expect(res.status).toBe(200)
    expect(res.body.signedConsent).toBe(true)
    expect(res.body.signerName).toBe('Demo Customer')
    expect(res.body.signedAt).not.toBeNull()
    expect(await statusOf(bookingId)).toBe('picked-up')
  })

  it('409s when signing before the OTP has been verified (box not opened)', async () => {
    const bookingId = await preparedBooking()
    // OTP issued but never verified → no proof of unlock.
    await request(app).post(`/otps/${bookingId}/issue`).set(bearer(providerToken)).send({})
    expect((await sign(customerToken, bookingId, { signerName: 'X', consent: true })).status).toBe(409)
  })

  it('400s when consent is not given', async () => {
    const bookingId = await preparedBooking()
    await unlock(bookingId)
    expect((await sign(customerToken, bookingId, { signerName: 'X', consent: false })).status).toBe(400)
  })

  it('409s on a double sign', async () => {
    const bookingId = await preparedBooking()
    await unlock(bookingId)
    expect((await sign(customerToken, bookingId, { signerName: 'X', consent: true })).status).toBe(200)
    expect((await sign(customerToken, bookingId, { signerName: 'X', consent: true })).status).toBe(409)
  })

  it('403s a provider trying to sign', async () => {
    const bookingId = await preparedBooking()
    await unlock(bookingId)
    expect((await sign(providerToken, bookingId, { signerName: 'X', consent: true })).status).toBe(403)
  })

  it('404s a customer signing a booking they do not own', async () => {
    const bookingId = await preparedBooking()
    await unlock(bookingId)
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: `ctr_cust2_${Date.now()}@test.com`, password: 'Password123!', name: 'Other', role: 'customer' })
    expect((await sign(reg.body.token, bookingId, { signerName: 'X', consent: true })).status).toBe(404)
  })

  it('401s without a token', async () => {
    const bookingId = await preparedBooking()
    expect((await request(app).post(`/contracts/${bookingId}/sign`).send({ signerName: 'X', consent: true })).status).toBe(401)
  })
})
