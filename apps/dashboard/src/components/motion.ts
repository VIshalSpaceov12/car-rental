import { useReducedMotion, type Transition } from 'framer-motion'
import { useTheme } from '@car-rental/tokens'
import type { Theme } from '@car-rental/tokens'

/** Durations are ms in tokens; framer-motion `transition.duration` is seconds. */
const toSec = (ms: number) => ms / 1000

/**
 * Easing tuples in tokens are `[number, number, number, number]`; framer-motion's
 * `ease` accepts that cubic-bezier shape directly. Centralised so screens never
 * spread the tuple inline (no magic numbers, one motion vocabulary).
 */
export function tween(theme: Theme, duration: number, ease: readonly [number, number, number, number]): Transition {
  return { duration: toSec(duration), ease: ease as [number, number, number, number] }
}

/**
 * Press spring fed by `theme.motion.spring.press` — used for `whileTap` scale on
 * interactive surfaces (Button, nav). Web maps the same record RN feeds `withSpring`.
 */
export function pressSpring(theme: Theme): Transition {
  const { damping, stiffness, mass } = theme.motion.spring.press
  return { type: 'spring', damping, stiffness, mass }
}

/**
 * Motion primitives resolved from the active theme, reduced-motion aware. When the
 * user prefers reduced motion we collapse offsets/scale to identity and shorten
 * transitions to a near-instant cross-fade — never fully disabling so AnimatePresence
 * exit callbacks still fire.
 */
export function useMotion() {
  const theme = useTheme()
  const reduce = useReducedMotion() ?? false
  const m = theme.motion
  return {
    reduce,
    /** Standard in/out tween for section + element transitions. */
    standard: tween(theme, reduce ? m.duration.fast : m.duration.base, m.easing.standard),
    enter: tween(theme, reduce ? m.duration.fast : m.duration.slow, m.easing.enter),
    exit: tween(theme, reduce ? m.duration.fast : m.duration.base, m.easing.exit),
    press: pressSpring(theme),
    /** Y-offset for entrance slides; 0 when reduced. */
    riseY: reduce ? 0 : 8,
    /** Per-item stagger (s) for lists/grids; 0 when reduced. */
    stagger: reduce ? 0 : 0.04,
  }
}
