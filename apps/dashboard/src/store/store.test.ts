import { describe, it, expect } from 'vitest'
import { store } from './store'
import { fleetApi } from './fleetApi'
import { logout } from './authSlice'

describe('store — logout clears RTK Query caches', () => {
  it('drops cached query data when logout is dispatched (shared-device safety)', async () => {
    // Seed a cache entry as if the previous provider had loaded their categories.
    await store.dispatch(
      fleetApi.util.upsertQueryData('categories', undefined, [{ id: 'c1', name: 'SUV' }]),
    )
    expect(fleetApi.endpoints.categories.select(undefined)(store.getState()).data).toEqual([
      { id: 'c1', name: 'SUV' },
    ])

    store.dispatch(logout())

    // After logout the next user must not inherit the previous session's cache.
    expect(fleetApi.endpoints.categories.select(undefined)(store.getState()).data).toBeUndefined()
  })
})
