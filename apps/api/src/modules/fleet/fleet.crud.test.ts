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

  it('filters browse by fuelType and respects ?available=false', async () => {
    // A diesel + an unavailable vehicle under this provider.
    await request(app)
      .post('/vehicles')
      .set(bearer(providerToken))
      .send({ ...vehiclePayload(), name: 'Diesel', fuelType: 'diesel' })
    await request(app)
      .post('/vehicles')
      .set(bearer(providerToken))
      .send({ ...vehiclePayload(), name: 'Hidden', available: false })

    const diesel = await request(app).get(`/vehicles?providerId=${providerId}&fuelType=diesel`)
    expect(diesel.status).toBe(200)
    expect(diesel.body.length).toBeGreaterThan(0)
    expect(diesel.body.every((v: { fuelType: string }) => v.fuelType === 'diesel')).toBe(true)

    // Default browse hides the unavailable car…
    const dflt = await request(app).get(`/vehicles?providerId=${providerId}`)
    expect(dflt.body.some((v: { name: string }) => v.name === 'Hidden')).toBe(false)
    // …while ?available=false surfaces only unavailable ones.
    const hidden = await request(app).get(`/vehicles?providerId=${providerId}&available=false`)
    expect(hidden.body.every((v: { available: boolean }) => v.available === false)).toBe(true)
    expect(hidden.body.some((v: { name: string }) => v.name === 'Hidden')).toBe(true)
  })

  it('round-trips transmission/fuelType enums through create → wire (no miscast)', async () => {
    const created = await request(app)
      .post('/vehicles')
      .set(bearer(providerToken))
      .send({ ...vehiclePayload(), name: 'Manual Hybrid', transmission: 'manual', fuelType: 'hybrid' })
    expect(created.status).toBe(201)
    expect(created.body.transmission).toBe('manual')
    expect(created.body.fuelType).toBe('hybrid')

    const detail = await request(app).get(`/vehicles/${created.body.id}`)
    expect(detail.body.transmission).toBe('manual')
    expect(detail.body.fuelType).toBe('hybrid')
  })
})

describe('GET /provider/vehicles (tenant-scoped management list)', () => {
  it('rejects without a token (401) and for customers (403)', async () => {
    const noAuth = await request(app).get('/provider/vehicles')
    expect(noAuth.status).toBe(401)
    const asCustomer = await request(app).get('/provider/vehicles').set(bearer(customerToken))
    expect(asCustomer.status).toBe(403)
  })

  it('returns only the caller’s fleet, including unavailable vehicles', async () => {
    await request(app)
      .post('/vehicles')
      .set(bearer(providerToken))
      .send({ ...vehiclePayload(), name: 'Provider-Only Hidden', available: false })

    const res = await request(app).get('/provider/vehicles').set(bearer(providerToken))
    expect(res.status).toBe(200)
    expect(res.body.every((v: { providerId: string }) => v.providerId === providerId)).toBe(true)
    expect(res.body.some((v: { name: string }) => v.name === 'Provider-Only Hidden')).toBe(true)
  })
})

describe('cross-tenant category/branch deletes 404', () => {
  it('a foreign provider cannot delete this tenant’s category or branch', async () => {
    const category = await request(app)
      .post('/categories')
      .set(bearer(providerToken))
      .send({ name: `cat-${Date.now()}` })
    const branch = await request(app)
      .post('/branches')
      .set(bearer(providerToken))
      .send({ name: 'Main', address: 'X', lat: 25, lng: 55, hours: '9-5' })

    const other = await request(app).post('/auth/register').send({
      email: uniqueEmail('xtenant'),
      password: 'Password123!',
      name: 'X Tenant',
      role: 'service-provider',
      businessName: 'X Co',
    })
    const foreign = bearer(other.body.token)

    const delCat = await request(app).delete(`/categories/${category.body.id}`).set(foreign)
    expect(delCat.status).toBe(404)
    const delBranch = await request(app).delete(`/branches/${branch.body.id}`).set(foreign)
    expect(delBranch.status).toBe(404)
  })
})
