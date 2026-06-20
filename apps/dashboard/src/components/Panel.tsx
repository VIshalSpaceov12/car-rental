import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from '@car-rental/tokens'

// Soft lift tuned for the LIGHT dashboard — the shared elevation tokens are tuned
// for the dark app (0.18–0.28 black), too heavy on white. Mirrors Overview's chrome.
export const CARD_SHADOW = '0 1px 2px rgba(18,18,20,0.04), 0 10px 30px rgba(18,18,20,0.06)'

/**
 * Section card chrome — a white tile with a soft lift and an optional header row
 * (title + subtitle on the start, an action on the end). The premium container
 * the content panels compose, matching the Overview look.
 */
export function Panel({
  title,
  subtitle,
  action,
  children,
  style,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  style?: CSSProperties
}) {
  const theme = useTheme()
  return (
    <div
      style={{
        background: theme.color.background,
        border: `1px solid ${theme.color.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        boxShadow: CARD_SHADOW,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: theme.spacing.sm,
            marginBlockEnd: theme.spacing.lg,
          }}
        >
          <div>
            {title && (
              <h2 style={{ margin: 0, color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: theme.typography.title.fontWeight }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ margin: `${theme.spacing.xs}px 0 0`, color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
