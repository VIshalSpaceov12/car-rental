import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/**
 * Tracks the OS "reduce motion" accessibility setting. Animated primitives read
 * this to degrade their motion to an instant/cross-fade form (no slides, no
 * springs) so the redesign respects the user's preference.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    let mounted = true
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value)
    })
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduced(value)
    })
    return () => {
      mounted = false
      sub.remove()
    }
  }, [])

  return reduced
}
