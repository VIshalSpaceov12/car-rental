import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

describe('GET /vehicles', () => {
  it('returns seeded vehicles shaped like the @car-rental/types Vehicle contract', async () => {
    const res = await request(createApp()).get('/vehicles')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(6)

    const v = res.body[0]
    expect(typeof v.id).toBe('string')
    expect(typeof v.providerId).toBe('string')
    expect(typeof v.name).toBe('string')
    expect(typeof v.category).toBe('string')
    expect(typeof v.pricePerDay).toBe('number') // Decimal must serialize to number
    expect(Array.isArray(v.images)).toBe(true)
    expect(typeof v.available).toBe('boolean')
    expect(['automatic', 'manual']).toContain(v.transmission)
    expect(['petrol', 'diesel', 'electric', 'hybrid']).toContain(v.fuelType)
  })
})
