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
const RUN_BASE = Date.UTC(2030, 0, 1, 10) + Math.floor(Math.random() * 25_000) * 100 * DAY
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
  const id = created.body.id as string
  await request(app).post(`/payments/${id}/pay`).set(bearer(customerToken)).send({ method: 'card-mock' })
  await request(app).post(`/bookings/${id}/prepare`).set(bearer(providerToken)).send({})
  return id
}

/** Drive a booking through the full keyless pickup so it lands in `picked-up`. */
async function pickedUpBooking(): Promise<string> {
  const id = await preparedBooking()
  const code = (await request(app).post(`/otps/${id}/issue`).set(bearer(providerToken)).send({})).body.otp as string
  await request(app).post('/otps/verify').set(bearer(customerToken)).send({ bookingId: id, vehicleId: VEHICLE, otp: code })
  const signed = await request(app)
    .post(`/contracts/${id}/sign`)
    .set(bearer(customerToken))
    .send({ signerName: 'Demo Customer', consent: true })
  expect(signed.status).toBe(200)
  return id
}

const ret = (token: string, id: string) => request(app).post(`/bookings/${id}/return`).set(bearer(token)).send({})
const complete = (token: string, id: string, body: Record<string, unknown>) =>
  request(app).post(`/bookings/${id}/complete`).set(bearer(token)).send(body)
const inspection = (token: string, id: string) => request(app).get(`/bookings/${id}/inspection`).set(bearer(token))

async function statusOf(id: string): Promise<string> {
  const res = await request(app).get('/bookings').set(bearer(customerToken))
  return res.body.find((b: { id: string }) => b.id === id).status
}

beforeAll(async () => {
  customerToken = await login(CUSTOMER)
  providerToken = await login(PROVIDER)
})

describe('booking — customer return', () => {
  it('moves a picked-up booking to returned', async () => {
    const id = await pickedUpBooking()
    const res = await ret(customerToken, id)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('returned')
  })

  it('409s returning a booking that is not picked-up', async () => {
    const id = await preparedBooking()
    expect((await ret(customerToken, id)).status).toBe(409)
  })

  it('403s a provider trying to return', async () => {
    const id = await pickedUpBooking()
    expect((await ret(providerToken, id)).status).toBe(403)
  })

  it('404s a customer returning a booking they do not own', async () => {
    const id = await pickedUpBooking()
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: `ret_cust_${Date.now()}@test.com`, password: 'Password123!', name: 'Other', role: 'customer' })
    expect((await ret(reg.body.token, id)).status).toBe(404)
  })
})

describe('booking — provider complete + inspection', () => {
  it('completes a returned booking and records the inspection', async () => {
    const id = await pickedUpBooking()
    expect((await ret(customerToken, id)).status).toBe(200)

    const res = await complete(providerToken, id, { condition: 'minor-damage', notes: 'scuff on rear bumper' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('completed')
    expect(await statusOf(id)).toBe('completed')

    const insp = await inspection(providerToken, id)
    expect(insp.status).toBe(200)
    expect(insp.body.condition).toBe('minor-damage')
    expect(insp.body.notes).toBe('scuff on rear bumper')
    expect(insp.body.inspectedAt).toBeTruthy()
  })

  it('409s completing a booking that is not returned', async () => {
    const id = await pickedUpBooking()
    expect((await complete(providerToken, id, { condition: 'clean' })).status).toBe(409)
  })

  it('403s a customer trying to complete', async () => {
    const id = await pickedUpBooking()
    await ret(customerToken, id)
    expect((await complete(customerToken, id, { condition: 'clean' })).status).toBe(403)
  })

  it('404s a provider completing a booking outside its tenancy', async () => {
    const id = await pickedUpBooking()
    await ret(customerToken, id)
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: `ret_prov_${Date.now()}@test.com`, password: 'Password123!', name: 'Other', role: 'service-provider', businessName: 'Other Rentals' })
    expect((await complete(reg.body.token, id, { condition: 'clean' })).status).toBe(404)
  })

  it('400s on an invalid condition', async () => {
    const id = await pickedUpBooking()
    await ret(customerToken, id)
    expect((await complete(providerToken, id, { condition: 'wrecked' })).status).toBe(400)
  })

  it('404s reading an inspection that does not exist yet', async () => {
    const id = await pickedUpBooking()
    expect((await inspection(providerToken, id)).status).toBe(404)
  })
})
