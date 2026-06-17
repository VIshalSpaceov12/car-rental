import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@car-rental/tokens'
import { useMotion } from './motion'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  /** Show a toast; auto-dismisses after `duration` ms (default 4000). */
  show: (message: string, kind?: ToastKind, duration?: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** In-house toast hook — no third-party lib. Must be used under `ToastProvider`. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const DEFAULT_DURATION = 4000

/** Max width of a toast card (one-off layout dimension). */
const TOAST_MAX_WIDTH = 420

function kindColor(theme: ReturnType<typeof useTheme>, kind: ToastKind): string {
  switch (kind) {
    case 'success':
      return theme.color.success
    case 'error':
      return theme.color.danger
    case 'info':
      return theme.color.primary
  }
}

/** Leading glyph per toast kind — check / cross / info, stroked in currentColor. */
function KindIcon({ kind, size }: { kind: ToastKind; size: number }) {
  const path = kind === 'success' ? 'M20 6 9 17l-5-5' : kind === 'error' ? 'M18 6 6 18M6 6l12 12' : 'M12 8h.01M11 12h1v4h1'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      {kind === 'info' && <circle cx="12" cy="12" r="10" strokeWidth={2} />}
      <path d={path} />
    </svg>
  )
}

/**
 * Mounts a fixed, top-centered toast stack and provides `useToast()`. Toasts slide
 * down on enter (AnimatePresence), auto-dismiss, and dismiss on click. The stack
 * is anchored with logical insets only (`insetInlineStart/End`) so it centers
 * correctly in both LTR and RTL — no hardcoded left/right.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const m = useMotion()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback<ToastApi['show']>(
    (message, kind = 'info', duration = DEFAULT_DURATION) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, kind, message }])
      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        style={{
          position: 'fixed',
          insetBlockStart: theme.spacing.lg,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: theme.spacing.sm,
          zIndex: theme.zIndex.toast,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const color = kindColor(theme, t.kind)
            // Spring overshoot entrance (mockup's toast pop) via the spring easing tuple.
            const springEnter = {
              duration: theme.motion.duration.slow / 1000,
              ease: theme.motion.easing.spring,
            }
            return (
              <motion.div
                key={t.id}
                role="status"
                onClick={() => dismiss(t.id)}
                initial={{ opacity: 0, y: m.reduce ? 0 : -16 }}
                animate={{ opacity: 1, y: 0, transition: m.reduce ? m.enter : springEnter }}
                exit={{ opacity: 0, y: m.reduce ? 0 : -16, transition: m.exit }}
                style={{
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  background: theme.color.surfaceAlt,
                  color: theme.color.text,
                  border: `1px solid ${color}`,
                  borderRadius: theme.radius.md,
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  boxShadow: `0 8px 30px ${theme.color.overlay}`,
                  fontSize: theme.typography.body.fontSize,
                  maxWidth: TOAST_MAX_WIDTH,
                }}
              >
                <span style={{ color, display: 'inline-flex' }}>
                  <KindIcon kind={t.kind} size={theme.size.icon.sm} />
                </span>
                {t.message}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
