/**
 * Pure, timezone-safe calendar helpers for {@link DateField}. Dates are the
 * `YYYY-MM-DD` strings the booking draft collects; month indices are 0-based
 * (JS `Date` convention). All `Date` use pins to UTC so a day never shifts under
 * the device timezone — consistent with `bookingDraft`'s UTC day comparison.
 */

const pad2 = (n: number): string => String(n).padStart(2, '0')

/** `(year, 0-based month, day)` → `YYYY-MM-DD`. */
export function formatYmd(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`
}

/** Parse a strict `YYYY-MM-DD` string into 0-based parts, or null if malformed. */
export function parseYmd(value: string): { year: number; month0: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  return { year: Number(m[1]), month0: Number(m[2]) - 1, day: Number(m[3]) }
}

/** Shift a `(year, month0)` by `delta` months, normalizing across year bounds. */
export function addMonths(year: number, month0: number, delta: number): { year: number; month0: number } {
  const total = year * 12 + month0 + delta
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 }
}

/**
 * Sunday-first month grid: an array of week rows, each 7 cells. Cells outside the
 * month are `null`; in-month cells hold the day number. Padded to whole weeks.
 */
export function buildMonthGrid(year: number, month0: number): (number | null)[][] {
  const firstWeekday = new Date(Date.UTC(year, month0, 1)).getUTCDay() // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** The given instant's UTC calendar day as `YYYY-MM-DD` (the bookable floor). */
export function todayYmd(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}
