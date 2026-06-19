import { addMonths, buildMonthGrid, formatYmd, parseYmd, todayYmd } from './dateGrid'

describe('formatYmd', () => {
  it('zero-pads month and day (month is 0-indexed)', () => {
    expect(formatYmd(2026, 6, 1)).toBe('2026-07-01')
    expect(formatYmd(2026, 0, 5)).toBe('2026-01-05')
    expect(formatYmd(2026, 11, 31)).toBe('2026-12-31')
  })
})

describe('parseYmd', () => {
  it('parses a valid YYYY-MM-DD into 0-indexed parts', () => {
    expect(parseYmd('2026-07-01')).toEqual({ year: 2026, month0: 6, day: 1 })
  })
  it('returns null for malformed input', () => {
    expect(parseYmd('')).toBeNull()
    expect(parseYmd('2026-7-1')).toBeNull()
    expect(parseYmd('nope')).toBeNull()
  })
})

describe('addMonths', () => {
  it('wraps across year boundaries', () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month0: 0 })
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month0: 11 })
    expect(addMonths(2026, 6, 0)).toEqual({ year: 2026, month0: 6 })
  })
})

describe('buildMonthGrid', () => {
  it('lays out July 2026 (starts Wed, 31 days) as Sunday-first weeks', () => {
    const grid = buildMonthGrid(2026, 6)
    expect(grid).toHaveLength(5)
    expect(grid.every((week) => week.length === 7)).toBe(true)
    expect(grid[0]).toEqual([null, null, null, 1, 2, 3, 4])
    expect(grid[4]).toEqual([26, 27, 28, 29, 30, 31, null])
    // every calendar day appears exactly once
    const days = grid.flat().filter((d): d is number => d !== null)
    expect(days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
  })

  it('handles a leap February (Feb 2024 starts Thu, 29 days)', () => {
    const grid = buildMonthGrid(2024, 1)
    expect(grid[0]).toEqual([null, null, null, null, 1, 2, 3])
    expect(grid.flat().filter((d) => d !== null)).toHaveLength(29)
  })
})

describe('todayYmd', () => {
  it('formats the given instant as a UTC calendar day', () => {
    expect(todayYmd(new Date('2026-06-19T23:30:00.000Z'))).toBe('2026-06-19')
  })
})
