import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { I18nManager, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '@car-rental/tokens'
import { useReducedMotion } from './useReducedMotion'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastOptions {
  message: string
  variant?: ToastVariant
  /** Auto-dismiss after this many ms (default = motion.duration.hero * a few). */
  duration?: number
}

interface ToastContextValue {
  show: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Default time a toast stays on screen before auto-dismissing. */
const VISIBLE_MS = 3000
// How far the card slides up to hide (and the swipe distance to dismiss).
const HIDDEN_OFFSET = -120
const SWIPE_DISMISS = 60

/**
 * In-house toast (no third-party lib). Mount `ToastProvider` high in the tree;
 * any screen calls `useToast().show({...})`. Toasts slide down from the top, auto
 * dismiss, and are swipe-up to dismiss. This is the OTP / payment / error channel.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null)
  const keyRef = useRef(0)

  const show = useCallback((options: ToastOptions) => {
    keyRef.current += 1
    setToast({ ...options, key: keyRef.current })
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <ToastCard
          // Remount per show so the entrance animation replays for back-to-back toasts.
          key={toast.key}
          message={toast.message}
          variant={toast.variant ?? 'info'}
          duration={toast.duration ?? VISIBLE_MS}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

function ToastCard({
  message,
  variant,
  duration,
  onDismiss,
}: {
  message: string
  variant: ToastVariant
  duration: number
  onDismiss: () => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()

  const translateY = useSharedValue(reduced ? 0 : HIDDEN_OFFSET)
  const opacity = useSharedValue(reduced ? 1 : 0)

  const timing = { duration: theme.motion.duration.base, easing: Easing.bezier(...theme.motion.easing.standard) }

  const hide = useCallback(() => {
    if (reduced) {
      runOnJS(onDismiss)()
      return
    }
    opacity.value = withTiming(0, { duration: theme.motion.duration.fast })
    translateY.value = withTiming(HIDDEN_OFFSET, timing, (finished) => {
      if (finished) runOnJS(onDismiss)()
    })
  }, [reduced])

  useEffect(() => {
    if (!reduced) {
      opacity.value = withTiming(1, { duration: theme.motion.duration.base })
      translateY.value = withTiming(0, timing)
    }
    const t = setTimeout(hide, duration)
    return () => clearTimeout(t)
  }, [])

  // Swipe-up to dismiss. Logical for RTL is moot on the Y axis, but we keep the
  // gesture vertical so it reads the same in both directions.
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) translateY.value = e.translationY
    })
    .onEnd((e) => {
      if (e.translationY < -SWIPE_DISMISS) {
        runOnJS(hide)()
      } else {
        translateY.value = withTiming(0, { duration: theme.motion.duration.fast })
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const accent =
    variant === 'success' ? theme.color.success : variant === 'error' ? theme.color.danger : theme.color.primary

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + theme.spacing.sm,
        start: 0,
        end: 0,
        alignItems: 'center',
        zIndex: theme.zIndex.toast,
      }}
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            animatedStyle,
            {
              maxWidth: '92%',
              flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              backgroundColor: theme.color.surface,
              borderStartWidth: 4,
              borderStartColor: accent,
              borderRadius: theme.radius.md,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              ...theme.elevation.lg,
            },
          ]}
        >
          <Text style={{ color: theme.color.text, fontSize: theme.typography.body.fontSize, flexShrink: 1 }}>
            {message}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}
