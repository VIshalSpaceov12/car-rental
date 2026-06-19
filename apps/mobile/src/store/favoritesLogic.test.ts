import { toggleId } from './favoritesLogic'

describe('toggleId', () => {
  it('adds an absent id to the front', () => {
    expect(toggleId([], 'veh-a')).toEqual(['veh-a'])
    expect(toggleId(['veh-a'], 'veh-b')).toEqual(['veh-b', 'veh-a'])
  })

  it('removes a present id, leaving order otherwise intact', () => {
    expect(toggleId(['veh-b', 'veh-a'], 'veh-a')).toEqual(['veh-b'])
    expect(toggleId(['veh-a'], 'veh-a')).toEqual([])
  })

  it('does not mutate the input array', () => {
    const ids = ['veh-a']
    toggleId(ids, 'veh-b')
    expect(ids).toEqual(['veh-a'])
  })
})
