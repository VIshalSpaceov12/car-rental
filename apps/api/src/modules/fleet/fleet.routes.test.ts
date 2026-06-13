import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

const app = createApp()

describe('GET /vehicles', () => {
  it('returns seeded vehicles shaped like the @car-rental/types Vehicle contract', async () => {
    const res = await request(app).get('/vehicles')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(6) // ≥ seeded set (CRUD tests add more)

    const v = res.body[0]
    expect(typeof v.id).toBe('string')
    expect(typeof v.providerId).toBe('string')
    expect(typeof v.name).toBe('string')
    expect(typeof v.categoryId).toBe('string')
    expect(typeof v.category).toBe('string')
    expect(typeof v.pricePerDay).toBe('number') // Decimal must serialize to number
    expect(Array.isArray(v.images)).toBe(true)
    expect(typeof v.available).toBe('boolean')
    expect(['automatic', 'manual']).toContain(v.transmission)
    expect(['petrol', 'diesel', 'electric', 'hybrid']).toContain(v.fuelType)
  })

  it('defaults to available-only on the public browse', async () => {
    const res = await request(app).get('/vehicles')
    expect(res.status).toBe(200)
    expect(res.body.every((v: { available: boolean }) => v.available === true)).toBe(true)
  })

  it('filters by minPrice', async () => {
    const res = await request(app).get('/vehicles?minPrice=300')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body.every((v: { pricePerDay: number }) => v.pricePerDay >= 300)).toBe(true)
  })

  it('filters by fuelType', async () => {
    const res = await request(app).get('/vehicles?fuelType=electric')
    expect(res.status).toBe(200)
    expect(res.body.every((v: { fuelType: string }) => v.fuelType === 'electric')).toBe(true)
    expect(res.body.some((v: { id: string }) => v.id === 'veh-model3')).toBe(true)
  })
})

describe('GET /vehicles/categories (public browse type-filter)', () => {
  it('returns category rows without auth (not shadowed by /:id)', async () => {
    const res = await request(app).get('/vehicles/categories')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    const c = res.body[0]
    expect(typeof c.id).toBe('string')
    expect(typeof c.name).toBe('string')
  })
})
