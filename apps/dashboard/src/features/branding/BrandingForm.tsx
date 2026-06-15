import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { ProviderBranding, UpdateBrandingRequest } from '@car-rental/types'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

// One-off form width (no semantic size fits) — named const, not a token.
const FORM_MAX_WIDTH = 420
// One-off preview swatch dimension; a brand-color sample, not a layout primitive.
const SWATCH_SIZE = 48

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
 * renders in isolation under a test ThemeProvider. The live preview swatch + button
 * paint with the *entered* colors (form state), giving the provider an immediate read
 * on their palette before persisting.
 */
export function BrandingForm({ branding, saving, status, onSave }: BrandingFormProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [name, setName] = useState(branding?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl ?? '')
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

  return (
    <div>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>{t('branding.title')}</h1>
      <p style={{ color: theme.color.textMuted }}>{t('branding.intro')}</p>

      <form onSubmit={submit} style={{ maxWidth: FORM_MAX_WIDTH }}>
        <TextField label={t('branding.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label={t('branding.logoUrl')}
          placeholder={t('branding.logoUrlPlaceholder')}
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />

        <h2 style={{ color: theme.color.text }}>{t('branding.colorsTitle')}</h2>
        <TextField
          label={t('branding.primary')}
          placeholder={t('branding.colorPlaceholder')}
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
        />
        <TextField
          label={t('branding.primaryDark')}
          placeholder={t('branding.colorPlaceholder')}
          value={primaryDark}
          onChange={(e) => setPrimaryDark(e.target.value)}
        />
        <TextField
          label={t('branding.background')}
          placeholder={t('branding.colorPlaceholder')}
          value={background}
          onChange={(e) => setBackground(e.target.value)}
        />

        <div style={{ marginBottom: theme.spacing.md }}>
          <span
            style={{
              display: 'block',
              color: theme.color.text,
              marginBottom: theme.spacing.xs,
              fontSize: theme.typography.body.fontSize,
            }}
          >
            {t('branding.previewTitle')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span
              aria-label={t('branding.previewTitle')}
              style={{
                display: 'inline-block',
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                borderRadius: theme.radius.sm,
                // Live swatch: the entered primary color (form state), not a literal.
                background: primary || theme.color.surfaceAlt,
                border: `1px solid ${theme.color.textMuted}`,
              }}
            />
            <button
              type="button"
              disabled
              style={{
                background: primary || theme.color.primary,
                color: theme.color.onPrimary,
                border: 'none',
                borderRadius: theme.radius.md,
                padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                fontSize: theme.typography.body.fontSize,
              }}
            >
              {t('branding.previewButton')}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? t('branding.saving') : t('branding.save')}
        </Button>

        {status && (
          <p
            role="status"
            style={{
              color: status.kind === 'success' ? theme.color.primary : theme.color.danger,
              marginTop: theme.spacing.sm,
            }}
          >
            {status.message}
          </p>
        )}
      </form>
    </div>
  )
}
