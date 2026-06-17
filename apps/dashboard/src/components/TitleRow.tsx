import type { ReactNode } from 'react'
import { useTheme } from '@car-rental/tokens'

interface Props {
  /** Section heading — rendered in `theme.color.text` (the mockup's title color). */
  title: string
  /** Optional muted one-line context under the title. */
  subtitle?: string
  /** Optional action(s) pinned to the inline-end edge (e.g. a CTA pill). */
  action?: ReactNode
}

/**
 * Shared dashboard title row — heading + muted subtitle on the inline-start, an
 * optional action on the inline-end. Mirrors the mockup's `.dash-title-row`; the
 * heading uses `text` (not `primary`) per the Midnight GT look.
 */
export function TitleRow({ title, subtitle, action }: Props) {
  const theme = useTheme()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBlockEnd: theme.spacing.lg,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: theme.color.text,
            fontSize: theme.typography.heading.fontSize,
            fontWeight: theme.typography.heading.fontWeight,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin: 0, color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
