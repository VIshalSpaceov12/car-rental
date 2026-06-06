import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

const app = createApp()
const uniqueEmail = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`

// A fresh provider tenant + token + customer token for the suite.
let providerToken = ''
let providerId = ''
let customerToken = ''
let categoryId = ''

beforeAll(async () => {
  const prov = await request(app).post('/auth/register').send({
    email: uniqueEmail('fleetprov'),
    password: 'Password123!',
    name: 'Fleet Prov',
    role: 'service-provider',
    businessName: 'Fleet Co',
  })
  providerToken = prov.body.token
  providerId = prov.body.user.providerId

  const cust = await request(app).post('/auth/register').send({
    email: uniqueEmail('fleetcust'),
    password: 'Password123!',
    name: 'Fleet Cust',
    role: 'customer',
  })
  customerToken = cust.body.token

  const cat = await request(app)
    .post('/categories')
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ name: 'sedan' })
  categoryId = cat.body.id
})

const bearer = (t: string) => ({ Authorization: `Bearer ${t}` })

function vehiclePayload() {
  return {
    name: 'Test Car',
    categoryId,
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 5,
    pricePerDay: 150,
    currency: 'AED',
    available: true,
  }
}

describe('fleet CRUD + browse', () => {
  it('creates a category for the provider', () => {
    expect(typeof categoryId).toBe('string')
    expect(categoryId.length).toBeGreaterThan(0)
  })

  it('rejects vehicle creation without a token (401) and for customers (403)', async () => {
    const noAuth = await request(app).post('/vehicles').send(vehiclePayload())
    expect(noAuth.status).toBe(401)

    const asCustomer = await request(app)
      .post('/vehicles')
      .set(bearer(customerToken))
      .send(vehiclePayload())
    expect(asCustomer.status).toBe(403)
  })

  it('lets a provider create a vehicle, then browse + detail return it', async () => {
    const created = await request(app)
      .post('/vehicles')
      .set(bearer(providerToken))
      .send(vehiclePayload())
    expect(created.status).toBe(201)
    expect(created.body.providerId).toBe(providerId)
    expect(created.body.category).toBe('sedan')
    expect(created.body.pricePerDay).toBe(150)
    const id: string = created.body.id

    const browse = await request(app).get(`/vehicles?providerId=${providerId}`)
    expect(browse.status).toBe(200)
    expect(browse.body).toHaveLength(1)
    expect(browse.body[0].id).toBe(id)

    const detail = await request(app).get(`/vehicles/${id}`)
    expect(detail.status).toBe(200)
    expect(detail.body.id).toBe(id)
  })

  it('filters browse by maxPrice and transmission', async () => {
    // create a cheap manual car under the same provider
    await request(app)
      .post('/vehicles')
      .set(bearer(providerToken))
      .send({ ...vehiclePayload(), name: 'Cheap', transmission: 'manual', pricePerDay: 80 })

    const cheap = await request(app).get(`/vehicles?providerId=${providerId}&maxPrice=100`)
    expect(cheap.status).toBe(200)
    expect(cheap.body.every((v: { pricePerDay: number }) => v.pricePerDay <= 100)).toBe(true)

    const manual = await request(app).get(`/vehicles?providerId=${providerId}&transmission=manual`)
    expect(manual.body.every((v: { transmission: string }) => v.transmission === 'manual')).toBe(true)
  })

  it('updates and deletes only the provider’s own vehicle', async () => {
    const created = await request(app)
      .post('/vehicles')
      .set(bearer(providerToken))
      .send(vehiclePayload())
    const id: string = created.body.id

    const updated = await request(app)
      .patch(`/vehicles/${id}`)
      .set(bearer(providerToken))
      .send({ pricePerDay: 999 })
    expect(updated.status).toBe(200)
    expect(updated.body.pricePerDay).toBe(999)

    // a different provider cannot update/delete it
    const other = await request(app).post('/auth/register').send({
      email: uniqueEmail('other'),
      password: 'Password123!',
      name: 'Other',
      role: 'service-provider',
      businessName: 'Other Co',
    })
    const foreign = await request(app)
      .patch(`/vehicles/${id}`)
      .set(bearer(other.body.token))
      .send({ pricePerDay: 1 })
    expect(foreign.status).toBe(404)

    const del = await request(app).delete(`/vehicles/${id}`).set(bearer(providerToken))
    expect(del.status).toBe(204)
  })
})
