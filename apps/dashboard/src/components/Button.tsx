import type { ButtonHTMLAttributes } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '@car-rental/tokens'
import { useMotion } from './motion'

// framer-motion's `motion.button` redefines a handful of DOM handlers
// (`onDrag`, `onAnimationStart`, …) with its own gesture/animation signatures,
// which collide with the React HTML versions. We keep the public API as plain
// `ButtonHTMLAttributes` (callers never use those handlers) and drop them from
// what we forward, so the spread is structurally compatible with motion's props.
type ConflictingHandlers = 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
type MotionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, ConflictingHandlers> & {
  /** Full-width block layout (default) vs an inline pill that hugs its content. */
  fullWidth?: boolean
  /** Corner treatment — `md` card corner (default) or a `pill`. */
  radius?: 'md' | 'pill'
}

// Co-located keyframe driving the panning brand gradient (mirrors the mockup's
// `gradient-pan`). Injected once via <style>; duplicate identical tags are harmless.
const PAN_KEYFRAMES = '@keyframes cr-btn-gradient-pan { 0% { background-position: 0% 50% } 100% { background-position: 300% 50% } }'
/** Panning-gradient cycle (ms) — matches the mockup's ~4s linear loop. */
const PAN_DURATION = 4000
/** Escalated hover glow blur radius / spread (one-off shadow dimensions). */
const HOVER_GLOW = '0 12px 44px rgba(255,59,48,0.55)'

/**
 * Primary action button — "Midnight GT" treatment: an animated 120° panning
 * gradient (ember→red→ember) with a brand glow, a press-scale via `whileTap`, and
 * a glow escalation on hover. Disabled drops the gradient/glow for a flat muted
 * fill and skips the animations. `fullWidth` (default true) keeps every existing
 * block-layout call site; pass `false` for an inline pill. Reduced-motion holds the
 * gradient static.
 */
export function Button({ children, style, disabled, fullWidth = true, radius = 'md', ...props }: MotionButtonProps) {
  const theme = useTheme()
  const motionTokens = useMotion()
  const reduce = useReducedMotion() ?? false
  const [g0, g1] = theme.color.gradientPrimary
  const motionProps = props as HTMLMotionProps<'button'>
  const animated = !disabled && !reduce
  const baseGlow = `0 8px 30px ${theme.color.glow}`
  return (
    <>
      <style>{PAN_KEYFRAMES}</style>
      <motion.button
        {...motionProps}
        disabled={disabled}
        whileTap={disabled || reduce ? undefined : { scale: 0.97 }}
        whileHover={disabled ? undefined : { boxShadow: HOVER_GLOW }}
        transition={motionTokens.press}
        style={{
          background: disabled
            ? theme.color.textMuted
            : `linear-gradient(120deg, ${g0}, ${g1}, ${theme.color.primaryDark}, ${g0})`,
          backgroundSize: '300% 100%',
          animation: animated
            ? `cr-btn-gradient-pan ${PAN_DURATION}ms linear infinite`
            : undefined,
          boxShadow: disabled ? 'none' : baseGlow,
          color: theme.color.onPrimary,
          border: 'none',
          borderRadius: radius === 'pill' ? theme.radius.pill : theme.radius.md,
          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
          fontSize: theme.typography.body.fontSize,
          cursor: disabled ? 'default' : 'pointer',
          width: fullWidth ? '100%' : undefined,
          ...style,
        }}
      >
        {children}
      </motion.button>
    </>
  )
}
