import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

const app = createApp()
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** Register a fresh provider tenant so the test never mutates the seeded demo brand. */
async function newProvider(): Promise<string> {
  const res = await request(app)
    .post('/auth/register')
    .send({
      email: `brand_prov_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`,
      password: 'Password123!',
      name: 'Brand Owner',
      role: 'service-provider',
      businessName: 'Brandco Rentals',
    })
  expect(res.status).toBe(201)
  return res.body.token
}

const update = (token: string, body: object) => request(app).patch('/branding').set(bearer(token)).send(body)

const VALID = {
  name: 'Sunset Rentals',
  logoUrl: 'https://cdn.example.com/sunset.png',
  colors: { primary: '#1A7F5A', primaryDark: '#0F5C40', background: '#0A0A0B' },
}

describe('PATCH /branding', () => {
  it('updates the provider’s own branding and returns it', async () => {
    const token = await newProvider()
    const res = await update(token, VALID)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Sunset Rentals')
    expect(res.body.logoUrl).toBe('https://cdn.example.com/sunset.png')
    expect(res.body.colors.primary).toBe('#1A7F5A')
  })

  it('persists the update (reflected by GET /auth/me)', async () => {
    const token = await newProvider()
    await update(token, VALID)
    const me = await request(app).get('/auth/me').set(bearer(token))
    expect(me.status).toBe(200)
    expect(me.body.branding.name).toBe('Sunset Rentals')
    expect(me.body.branding.colors.primary).toBe('#1A7F5A')
  })

  it('clears the logo when logoUrl is null', async () => {
    const token = await newProvider()
    const res = await update(token, { ...VALID, logoUrl: null })
    expect(res.status).toBe(200)
    expect(res.body.logoUrl).toBeNull()
  })

  it('403s a customer', async () => {
    const login = await request(app).post('/auth/login').send({ email: 'customer@demo.test', password: 'Password123!' })
    expect((await update(login.body.token, VALID)).status).toBe(403)
  })

  it('401s without a token', async () => {
    expect((await request(app).patch('/branding').send(VALID)).status).toBe(401)
  })

  it('400s when the primary color is missing', async () => {
    const token = await newProvider()
    expect((await update(token, { name: 'X', logoUrl: null, colors: {} })).status).toBe(400)
  })

  it('400s when the name is empty', async () => {
    const token = await newProvider()
    expect((await update(token, { ...VALID, name: '' })).status).toBe(400)
  })
})
