import type { ComponentProps } from 'react'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

type IoniconName = ComponentProps<typeof Ionicons>['name']
type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name']
type IconDef = readonly ['ion', IoniconName] | readonly ['mci', MCIName]

/**
 * Curated semantic icon set — screens reference roles (`car`, `gearbox`), never
 * raw glyph names, so the icon vocabulary stays consistent and swappable.
 */
const ICONS = {
  car: ['ion', 'car-sport'],
  heart: ['ion', 'heart'],
  heartOutline: ['ion', 'heart-outline'],
  search: ['ion', 'search'],
  settings: ['ion', 'settings-sharp'],
  clock: ['ion', 'time-outline'],
  calendar: ['ion', 'calendar-outline'],
  home: ['ion', 'home'],
  arrowRight: ['ion', 'arrow-forward'],
  back: ['ion', 'chevron-back'],
  chevron: ['ion', 'chevron-forward'],
  star: ['ion', 'star'],
  filter: ['ion', 'options-outline'],
  check: ['ion', 'checkmark'],
  lock: ['ion', 'lock-closed'],
  unlock: ['ion', 'lock-open'],
  climate: ['ion', 'snow-outline'],
  acceleration: ['ion', 'speedometer-outline'],
  electricity: ['ion', 'battery-charging-outline'],
  gearbox: ['mci', 'car-shift-pattern'],
  transmission: ['mci', 'car-shift-pattern'],
  seat: ['mci', 'car-seat'],
  fuel: ['mci', 'gas-station-outline'],
  // Spec / detail glyphs
  engine: ['mci', 'engine-outline'],
  horsepower: ['mci', 'flash-outline'],
  // Header / navigation glyphs
  pin: ['ion', 'location-sharp'],
  person: ['ion', 'person'],
  bookmark: ['ion', 'bookmark'],
  bookmarkOutline: ['ion', 'bookmark-outline'],
} satisfies Record<string, IconDef>

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: string }) {
  const def: IconDef = ICONS[name]
  return def[0] === 'ion' ? (
    <Ionicons name={def[1]} size={size} color={color} />
  ) : (
    <MaterialCommunityIcons name={def[1]} size={size} color={color} />
  )
}
