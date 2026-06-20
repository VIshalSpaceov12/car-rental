import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useMotion } from './motion'

/**
 * Staggered fade + y entrance for table rows and card grids. Wrap a list in
 * `<AnimatedList>` and each item in `<AnimatedRow>`; the parent orchestrates the
 * stagger via variants so children don't each own timing. Reduced-motion collapses
 * offset/stagger to an instant cross-fade (see useMotion).
 *
 * `as` lets a row render as the correct DOM element (e.g. `tr`) so it stays valid
 * inside a `<tbody>` — framer-motion exposes a motion component per tag.
 */

interface ListProps {
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export function AnimatedList({ children, style, className }: ListProps) {
  const m = useMotion()
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: m.stagger } },
  }
  return (
    <motion.div variants={variants} initial="hidden" animate="show" style={style} className={className}>
      {children}
    </motion.div>
  )
}

interface RowProps {
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export function AnimatedRow({ children, style, className }: RowProps) {
  const m = useMotion()
  const variants: Variants = {
    hidden: { opacity: 0, y: m.riseY },
    show: { opacity: 1, y: 0, transition: m.enter },
  }
  return (
    <motion.div variants={variants} style={style} className={className}>
      {children}
    </motion.div>
  )
}

/** `<tr>` variant for table bodies — same variants, valid table markup. */
export function AnimatedTableRow({ children, style, className }: RowProps) {
  const m = useMotion()
  const variants: Variants = {
    hidden: { opacity: 0, y: m.riseY },
    show: { opacity: 1, y: 0, transition: m.enter },
  }
  return (
    <motion.tr variants={variants} style={style} className={className}>
      {children}
    </motion.tr>
  )
}

/** `<tbody>` orchestrator so table rows stagger without an extra wrapper div. */
export function AnimatedTableBody({ children, style }: ListProps) {
  const m = useMotion()
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: m.stagger } },
  }
  return (
    <motion.tbody variants={variants} initial="hidden" animate="show" style={style}>
      {children}
    </motion.tbody>
  )
}
