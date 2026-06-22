import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { FuelType, Transmission, Vehicle } from '@car-rental/types'
import { useTheme } from '@car-rental/tokens'
import { useMotion } from './motion'
import { CARD_SHADOW } from './Panel'

// Enum values are localized for display; the raw enum is the wire/storage value.
export const TRANSMISSION_LABEL_KEY: Record<
  Transmission,
  'fleet.transmissionValue.automatic' | 'fleet.transmissionValue.manual'
> = {
  automatic: 'fleet.transmissionValue.automatic',
  manual: 'fleet.transmissionValue.manual',
}
export const FUEL_LABEL_KEY: Record<
  FuelType,
  | 'fleet.fuelValue.petrol'
  | 'fleet.fuelValue.diesel'
  | 'fleet.fuelValue.electric'
  | 'fleet.fuelValue.hybrid'
> = {
  petrol: 'fleet.fuelValue.petrol',
  diesel: 'fleet.fuelValue.diesel',
  electric: 'fleet.fuelValue.electric',
  hybrid: 'fleet.fuelValue.hybrid',
}

// One-off layout dimensions (no semantic size token fits) — kept as named consts.
const IMAGE_HEIGHT = 156
const GLYPH_SIZE = 48
const DOT_SIZE = 6
// Hover lift shadow, matching the Overview KPI cards (the shared elevation
// tokens are tuned for the dark app, too heavy on this white canvas).
const CARD_SHADOW_HOVER = '0 2px 6px rgba(18,18,20,0.06), 0 18px 44px rgba(18,18,20,0.10)'

/** #RGB / #RRGGBB → rgba() at the given alpha; non-hex falls back to itself. */
function rgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return hex
  const raw = m[1] ?? ''
  const h = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Fallback silhouette shown when a vehicle has no uploaded image. */
function CarGlyph({ color }: { color: string }) {
  return (
    <svg
      width={GLYPH_SIZE}
      height={GLYPH_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 11l1.5-4.2A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.3L19 11" />
      <path d="M3 11h18v5a1 1 0 0 1-1 1h-1.2a2 2 0 0 1-3.9 0H9.1a2 2 0 0 1-3.9 0H4a1 1 0 0 1-1-1z" />
      <circle cx="7" cy="14.5" r="1" fill={color} stroke="none" />
      <circle cx="17" cy="14.5" r="1" fill={color} stroke="none" />
    </svg>
  )
}

/** Text action (edit/delete) — inline-styled with a motion-driven hover tint. */
function CardAction({
  label,
  color,
  hoverBg,
  onClick,
  reduce,
}: {
  label: string
  color: string
  hoverBg: string
  onClick: () => void
  reduce: boolean
}) {
  const theme = useTheme()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { backgroundColor: hoverBg }}
      whileTap={{ scale: 0.96 }}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color,
        borderRadius: theme.radius.pill,
        paddingBlock: 4,
        paddingInline: theme.spacing.sm,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: theme.typography.label.fontWeight,
      }}
    >
      {label}
    </motion.button>
  )
}

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const m = useMotion()
  const image = vehicle.images[0]

  const specChip: CSSProperties = {
    background: theme.color.surfaceAlt,
    color: theme.color.textMuted,
    borderRadius: theme.radius.sm,
    paddingBlock: 2,
    paddingInline: theme.spacing.sm,
    fontSize: theme.typography.caption.fontSize,
    whiteSpace: 'nowrap',
  }

  return (
    <motion.article
      whileHover={m.reduce ? undefined : { y: -3, boxShadow: CARD_SHADOW_HOVER }}
      transition={m.standard}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme.color.background,
        border: `1px solid ${theme.color.border}`,
        borderRadius: theme.radius.card,
        boxShadow: CARD_SHADOW,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Image / fallback */}
      <div style={{ position: 'relative', height: IMAGE_HEIGHT, background: rgba(theme.color.primary, 0.06) }}>
        {image ? (
          <img
            src={image}
            alt={vehicle.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
            <CarGlyph color={theme.color.textSubtle} />
          </div>
        )}
        <span
          style={{
            position: 'absolute',
            insetBlockStart: theme.spacing.sm,
            insetInlineEnd: theme.spacing.sm,
            display: 'inline-flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            background: vehicle.available ? rgba(theme.color.success, 0.16) : rgba(theme.color.danger, 0.16),
            color: vehicle.available ? theme.color.success : theme.color.danger,
            borderRadius: theme.radius.pill,
            paddingBlock: 2,
            paddingInline: theme.spacing.sm,
            fontSize: theme.typography.caption.fontSize,
            fontWeight: theme.typography.label.fontWeight,
            backdropFilter: 'blur(4px)',
          }}
        >
          <span aria-hidden style={{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: theme.radius.pill, background: 'currentColor' }} />
          {vehicle.available ? t('fleet.available') : t('fleet.unavailable')}
        </span>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, padding: theme.spacing.md, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.sm }}>
          <h3
            style={{
              margin: 0,
              color: theme.color.text,
              fontSize: theme.typography.title.fontSize,
              fontWeight: theme.typography.title.fontWeight,
            }}
          >
            {vehicle.name}
          </h3>
          <span
            style={{
              flexShrink: 0,
              background: rgba(theme.color.primary, 0.08),
              color: theme.color.text,
              border: `1px solid ${rgba(theme.color.primary, 0.2)}`,
              borderRadius: theme.radius.pill,
              paddingBlock: 2,
              paddingInline: theme.spacing.sm,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: theme.typography.label.fontWeight,
              whiteSpace: 'nowrap',
            }}
          >
            {vehicle.category}
          </span>
        </div>

        {/* Specs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <span style={specChip}>{t(TRANSMISSION_LABEL_KEY[vehicle.transmission])}</span>
          <span style={specChip}>{t(FUEL_LABEL_KEY[vehicle.fuelType])}</span>
          <span style={specChip}>{t('fleet.seatsCount', { count: vehicle.seats })}</span>
        </div>

        {/* Footer: price + actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing.sm,
            marginBlockStart: 'auto',
            paddingBlockStart: theme.spacing.sm,
            borderBlockStart: `1px solid ${theme.color.surfaceAlt}`,
          }}
        >
          <div
            style={{
              fontWeight: theme.typography.label.fontWeight,
              fontVariantNumeric: 'tabular-nums',
              color: theme.color.text,
              fontSize: theme.typography.body.fontSize,
              whiteSpace: 'nowrap',
            }}
          >
            {vehicle.pricePerDay}{' '}
            <span style={{ color: theme.color.textMuted, fontWeight: theme.typography.body.fontWeight, fontSize: theme.typography.caption.fontSize }}>
              {vehicle.currency} {t('fleet.perDay')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.xs, flexShrink: 0 }}>
            <CardAction label={t('common.edit')} color={theme.color.primary} hoverBg={theme.color.surfaceAlt} onClick={() => onEdit(vehicle.id)} reduce={m.reduce} />
            <CardAction label={t('common.delete')} color={theme.color.danger} hoverBg={rgba(theme.color.danger, 0.1)} onClick={() => onDelete(vehicle.id)} reduce={m.reduce} />
          </div>
        </div>
      </div>
    </motion.article>
  )
}
