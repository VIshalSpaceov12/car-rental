/**
 * Pure favorites set logic, kept free of Redux/immer so it unit-tests without the
 * jest-expo ESM transform. {@link favoritesSlice} is a thin binding over this.
 */

/** Add `id` to the front when absent, or remove it when present. */
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]
}
