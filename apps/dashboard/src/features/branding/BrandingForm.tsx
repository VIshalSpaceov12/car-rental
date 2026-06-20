import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { ProviderBranding, UpdateBrandingRequest } from '@car-rental/types'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { Panel } from '../../components/Panel'

// One-off form width (no semantic size fits) — named const, not a token.
const FORM_MAX_WIDTH = 640
// Color-well control width + logo preview height (one-off sample dimensions).
const WELL_WIDTH = 52
const LOGO_PREVIEW_HEIGHT = 40
const BRAND_AVATAR_SIZE = 34

/** Normalize a user hex (`#abc` / `#aabbcc`, with or without `#`) to `#rrggbb`, else fallback. */
function toWell(value: string, fallback: string): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value.trim())
  if (!m) return fallback
  const raw = m[1] ?? ''
  const h = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  return `#${h.toLowerCase()}`
}

/** Readable ink (near-black / white) for text laid over the given hex background. */
function readableOn(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return '#ffffff'
  const n = parseInt(m[1] ?? '', 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#111111' : '#ffffff'
}

export interface BrandingFormProps {
  /** Current branding to prefill the form (null before any branding is set). */
  branding: ProviderBranding | null
  saving: boolean
  /** Optional status line: success/error message resolved by the container. */
  status?: { kind: 'success' | 'error'; message: string } | null
  onSave: (body: UpdateBrandingRequest) => void
}

/**
 * Presentational white-label branding editor. Prop-driven (no data fetching) so it
 * renders in isolation under a test ThemeProvider. Each color has a native picker
 * "well" synced with its hex field, and the live brand bar paints with the *entered*
 * colors/logo (form state) so the provider previews their palette before persisting.
 */
export function BrandingForm({ branding, saving, status, onSave }: BrandingFormProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [name, setName] = useState(branding?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl ?? '')
  const [logoError, setLogoError] = useState(false)
  const [primary, setPrimary] = useState(branding?.colors.primary ?? '')
  const [primaryDark, setPrimaryDark] = useState(branding?.colors.primaryDark ?? '')
  const [background, setBackground] = useState(branding?.colors.background ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !primary.trim()) return
    onSave({
      name: name.trim(),
      logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
      colors: {
        primary: primary.trim(),
        ...(primaryDark.trim() ? { primaryDark: primaryDark.trim() } : {}),
        ...(background.trim() ? { background: background.trim() } : {}),
      },
    })
  }

  const labelSpan: React.CSSProperties = {
    display: 'block',
    color: theme.color.text,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.body.fontSize,
  }
  const hexInput: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    boxSizing: 'border-box',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.color.border}`,
    background: theme.color.background,
    color: theme.color.text,
    fontSize: theme.typography.body.fontSize,
    fontVariantNumeric: 'tabular-nums',
  }

  // Color row: a native picker well + the hex field, both driving the same state.
  // The hex field owns the label (`aria-label`); the well carries a `title` so it
  // stays a separate, unambiguous control for tests and assistive tech.
  const colorField = (label: string, value: string, onChange: (v: string) => void) => (
    <div style={{ marginBottom: theme.spacing.md }}>
      <span style={labelSpan}>{label}</span>
      <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'stretch' }}>
        <input
          type="color"
          title={label}
          value={toWell(value, '#000000')}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: WELL_WIDTH, padding: 2, borderRadius: theme.radius.sm, border: `1px solid ${theme.color.border}`, background: theme.color.background, cursor: 'pointer' }}
        />
        <input aria-label={label} value={value} placeholder={t('branding.colorPlaceholder')} onChange={(e) => onChange(e.target.value)} style={hexInput} />
      </div>
    </div>
  )

  const bgSafe = toWell(background, theme.color.surface)
  const primarySafe = toWell(primary, theme.color.primary)
  const showLogo = logoUrl.trim().length > 0 && !logoError

  return (
    <div style={{ maxWidth: FORM_MAX_WIDTH, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div>
        <h1 style={{ margin: 0, color: theme.color.text, fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.display.fontWeight, letterSpacing: -0.5 }}>
          {t('branding.title')}
        </h1>
        <p style={{ margin: `${theme.spacing.xs}px 0 0`, color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>
          {t('branding.intro')}
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <Panel>
          <TextField label={t('branding.name')} value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label={t('branding.logoUrl')}
            placeholder={t('branding.logoUrlPlaceholder')}
            value={logoUrl}
            onChange={(e) => {
              setLogoUrl(e.target.value)
              setLogoError(false)
            }}
            style={{ marginBottom: 0 }}
          />
          {showLogo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBlockStart: theme.spacing.md }}>
              <img
                src={logoUrl.trim()}
                alt={t('branding.logoUrl')}
                onError={() => setLogoError(true)}
                style={{ height: LOGO_PREVIEW_HEIGHT, maxWidth: 160, objectFit: 'contain', borderRadius: theme.radius.sm, background: theme.color.surface, padding: theme.spacing.xs }}
              />
            </div>
          )}
        </Panel>

        <Panel title={t('branding.colorsTitle')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: theme.spacing.md, rowGap: 0 }}>
            {colorField(t('branding.primary'), primary, setPrimary)}
            {colorField(t('branding.primaryDark'), primaryDark, setPrimaryDark)}
            <div style={{ gridColumn: '1 / -1' }}>{colorField(t('branding.background'), background, setBackground)}</div>
          </div>

          {/* Live brand bar — paints with the entered logo + colors. */}
          <span style={{ display: 'block', color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, marginBottom: theme.spacing.xs }}>
            {t('branding.previewTitle')}
          </span>
          <div style={{ borderRadius: theme.radius.md, overflow: 'hidden', border: `1px solid ${theme.color.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, background: bgSafe }}>
              {showLogo ? (
                <img src={logoUrl.trim()} alt="" onError={() => setLogoError(true)} style={{ height: BRAND_AVATAR_SIZE, maxWidth: 120, objectFit: 'contain' }} />
              ) : (
                <span
                  aria-hidden
                  style={{ width: BRAND_AVATAR_SIZE, height: BRAND_AVATAR_SIZE, flexShrink: 0, borderRadius: theme.radius.pill, background: primarySafe, color: readableOn(primarySafe), display: 'grid', placeItems: 'center', fontWeight: theme.typography.label.fontWeight }}
                >
                  {(name.trim()[0] ?? 'B').toUpperCase()}
                </span>
              )}
              {name.trim() && (
                <span style={{ color: readableOn(bgSafe), fontWeight: theme.typography.label.fontWeight, fontSize: theme.typography.subtitle.fontSize }}>
                  {name.trim()}
                </span>
              )}
              <button
                type="button"
                disabled
                style={{ marginInlineStart: 'auto', background: primarySafe, color: readableOn(primarySafe), border: 'none', borderRadius: theme.radius.pill, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontSize: theme.typography.body.fontSize, fontWeight: theme.typography.label.fontWeight, whiteSpace: 'nowrap' }}
              >
                {t('branding.previewButton')}
              </button>
            </div>
          </div>
        </Panel>

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Button type="submit" fullWidth={false} disabled={saving}>
            {saving ? t('branding.saving') : t('branding.save')}
          </Button>
          {status && (
            <p role="status" style={{ margin: 0, color: status.kind === 'success' ? theme.color.primary : theme.color.danger }}>
              {status.message}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
