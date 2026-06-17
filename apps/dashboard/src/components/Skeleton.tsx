import { useReducedMotion } from 'framer-motion'
import { useTheme } from '@car-rental/tokens'

const SHIMMER_KEYFRAMES = '@keyframes cr-skeleton-shimmer { 0% { background-position: 150% 0 } 100% { background-position: -150% 0 } }'

/** Shimmer sweep cadence (ms) — matches the mockup's ~1400ms linear loop. */
const SHIMMER_DURATION = 1400

interface Props {
  /** CSS width — number (px) or any length string. Defaults to full width. */
  width?: number | string
  /** CSS height — number (px) or any length string. */
  height?: number | string
  /** Pill vs card corner; defaults to the small radius used by text lines. */
  radius?: number
  style?: React.CSSProperties
}

/**
 * Shimmer placeholder for loading states (replaces text "Loading…"). A moving
 * surface→surfaceAlt gradient driven by a CSS keyframe — no JS per-frame cost.
 * Respects prefers-reduced-motion by holding a static muted fill. The keyframe is
 * injected once via a co-located <style>; duplicate tags are harmless (same name).
 */
export function Skeleton({ width = '100%', height = 16, radius, style }: Props) {
  const theme = useTheme()
  const reduce = useReducedMotion() ?? false
  return (
    <>
      <style>{SHIMMER_KEYFRAMES}</style>
      <span
        aria-hidden
        style={{
          display: 'block',
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          // 100° sweep with a bright near-white mid stop over the surfaceAlt tile —
          // the mockup's `.scheme-light .sk` shimmer. `background` (white in the
          // light scheme) is the brightest token, so the highlight stays themeable.
          background: reduce
            ? theme.color.surfaceAlt
            : `linear-gradient(100deg, ${theme.color.surfaceAlt} 0%, ${theme.color.background} 45%, ${theme.color.surfaceAlt} 70%)`,
          backgroundSize: '250% 100%',
          animation: reduce ? undefined : `cr-skeleton-shimmer ${SHIMMER_DURATION}ms linear infinite`,
          ...style,
        }}
      />
    </>
  )
}
