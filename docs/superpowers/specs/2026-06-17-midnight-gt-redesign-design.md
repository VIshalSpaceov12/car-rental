# Design Spec — "Midnight GT" Redesign + Motion Layer

**Date:** 2026-06-17
**Status:** Approved (design) — pending implementation plan
**Scope:** Visual redesign + animation system across `@car-rental/tokens`, `apps/mobile`, `apps/dashboard`. **Frontend only — no API, DB, migration, or env changes.**
**Decision artifacts:** live previews in `docs/design-explorations/` (`index.html` + `direction-1-midnight-gt.html`).

## 1. Goal

The client dislikes the current visual design. Replace it with a modern look ("Midnight GT") and a real animation system ("Lively" baseline), integrated consistently across mobile (customer app) and dashboard (provider admin), **without** disturbing the existing token architecture, white-label override path, component layering, RTL support, or the booking-lifecycle model.

The redesign is implemented as a **scheme + motion-layer swap**, not a rewrite: component structure and the semantic token contract are preserved; the values behind the tokens change and a new motion layer is added.

## 2. Chosen direction — "Midnight GT"

Premium automotive night UI: deepened near-black canvas, ember→red accent gradient, frosted-glass surfaces, soft red glow. Evolves the existing dark racing-red brand rather than discarding it.

- **App (mobile):** dark scheme.
- **Dashboard (provider):** light scheme (data-dense admin stays legible — unchanged split).
- **Animation baseline:** Lively (full motion), always gated behind reduce-motion.

### Dark scheme (mobile, brand default)

| Role | Value |
|---|---|
| `primary` | `#FF453A` |
| `primaryDark` | `#D42E26` |
| `onPrimary` | `#FFFFFF` |
| `background` | `#08080A` |
| `surface` | `#141417` |
| `surfaceAlt` | `#1C1C21` |
| `text` | `#FFFFFF` |
| `textMuted` | `#9A9AA2` |
| `textSubtle` | `#6E6E76` |
| `border` | `#2A2A30` |
| `danger` | `#FF453A` |
| `success` | `#34D399` |
| `warning` | `#FBBF24` |
| `overlay` | `rgba(0,0,0,0.55)` |
| `gradientPrimary` *(new)* | `['#FF8A3D', '#FF3B30']` |
| `glow` *(new)* | `0 8px 30px rgba(255,69,58,0.35)` |

### Light scheme (dashboard)

Keeps current neutrals (`background #FFFFFF`, `surface #F5F5F7`, `surfaceAlt #ECECEF`, `text #121214`, `textMuted #55555C`, `textSubtle #76767E`, `border #C9C9CF`, `overlay rgba(0,0,0,0.45)`). Inherits the new `primary`/`primaryDark`; `gradientPrimary`/`glow` derived from those (see §3).

## 3. Token layer changes (`packages/tokens`)

### 3.1 Recolor (no structural change)
- `primitives.ts`: update the private `neutral`/`red`/`green` ramps to the Midnight GT values. Primitives stay private (not re-exported).
- `themes/dark.ts`: map the new dark scheme above.
- `themes/light.ts`: unchanged neutrals; inherits new brand primary.

### 3.2 Two new themeable color roles
Add to `ColorScheme` (so a missing value is a compile error, and white-label can override):
- `gradientPrimary: [string, string]` — accent gradient stops (start → end).
- `glow: string` — accent glow shadow string (framework-agnostic; RN maps to shadow props, web to `box-shadow`).

Both are **themeable** (live in each scheme), consistent with the "colors/brand are the only themeable layer" rule.

### 3.3 White-label derivation (preserves existing override path)
`createTheme(color, brandOverrides?)` currently merges `{...color, ...brandOverrides}`. Extend it so that **if a brand override supplies `primary`/`primaryDark` but not `gradientPrimary`/`glow`, those are derived** as: `gradientPrimary = [primary, primaryDark]` (no color-math/lighten util needed — deterministic from the two brand colors providers already supply), and `glow` = `primary` composited at a fixed alpha (≈0.35) into the shadow string. Result: existing provider branding configs (which only set `primary`/`primaryDark`/`background`) keep working and automatically get a coherent gradient + glow. Providers may still override either explicitly. The Midnight GT default scheme keeps its hand-picked ember→red gradient (`['#FF8A3D','#FF3B30']`) rather than the derived form.

### 3.4 New static `motion` token group on `Theme`
Not themeable (motion is static, like spacing/type). Implements the `design.md` motion spec that was previously unbuilt:

```
motion: {
  duration: { fast: 120, base: 200, slow: 320, hero: 480 },   // ms
  easing:   { standard, enter, exit },                         // cubic-bezier tuples / strings
  spring:   { press }                                          // snappy press spring config
}
```

Components resolve `theme.motion.*` — no inline durations/curves (lint-enforced like other tokens). `theme.test.ts` extended to assert the new roles exist on every scheme/theme.

## 4. Animation runtime — new dependencies

**These require approval (granted) and a mobile native rebuild.** No backend impact.

| Platform | Dependency | Purpose | Operational note |
|---|---|---|---|
| mobile | `react-native-reanimated` (v3) | 60fps springs, gradients, layout, gesture-driven motion | Adds Babel plugin (must be **last** in `babel.config.js`); **requires Expo dev-client native rebuild** (`expo prebuild` / EAS build) — not a JS-only OTA change |
| mobile | `react-native-gesture-handler` | Swipe-to-dismiss toast, press gestures | Native rebuild (same as above); root `GestureHandlerRootView` wrapper |
| mobile | `expo-linear-gradient` | Gradient fills (buttons, FABs, hero card) | Expo-managed; no extra native config |
| dashboard | `framer-motion` | Web entrances, layout animation, gestures | JS-only, drop-in |

In-house (no third-party lib, per `design.md`): **Toast**.

## 5. Shared component vocabulary

Same names + prop contracts in both `apps/mobile/src/components` and `apps/dashboard/src/components`; platform-specific impl (Reanimated/expo-linear-gradient vs framer-motion/CSS).

| Component | Behavior | Notes |
|---|---|---|
| `Button` | `variant="primary"` fills `gradientPrimary` + `glow`; press → `spring.press` scale 0.97 | Upgrade existing Button; keep current prop API |
| `Toast` | Slide-down, auto-dismiss, swipe-to-clear | In-house; OTP/payment/error feedback channel |
| `Skeleton` | Shimmer sweep | Replaces spinners on list/detail load |
| `AnimatedCard` / list entrance | Staggered fade + translateY | Browse list, fleet/bookings tables |
| `StatusChip` | Lifecycle-colored chip, cross-fade on status change | Mapping in §6 |
| `UnlockButton` | OTP lock→unlock hero morph + ripple + success toast, `duration.hero` | Mobile Pickup flow signature moment |

## 6. Status chip → booking lifecycle mapping

Authoritative enum stays in `@car-rental/types` (`reserved → confirmed → vehicle-prepared → picked-up → returned → completed`, + `rejected`/`cancelled`). Chip colors:

| Status | Color role |
|---|---|
| `reserved`, `vehicle-prepared` | `warning` |
| `confirmed`, `picked-up`, `completed` | `success` / `primary` |
| `returned` | `textMuted` |
| `rejected`, `cancelled` | `danger` |

## 7. Rollout (incremental; each step independently shippable)

1. **Tokens** — recolor + new roles + motion group + `createTheme` derivation + tests.
2. **Mobile deps + native rebuild** — install, configure Babel/gesture root, verify dev client boots.
3. **Mobile primitives** — `Button`, `Toast`, `Skeleton`, `StatusChip`, `AnimatedCard`, `UnlockButton`.
4. **Mobile screens** — Onboarding → Browse → VehicleDetail → Booking → **Pickup (OTP hero)** → Bookings/Settings.
5. **Dashboard deps + primitives** — `framer-motion`; matching `Button`/`Toast`/`Skeleton`/`StatusChip`.
6. **Dashboard screens** — Layout shell → stat cards (count-up) → Bookings table (status chips) → Fleet/Branches/Branding.

## 8. RTL + reduce-motion

- All motion uses logical direction; slide directions flip under AR (`I18nManager` on RN, `dir`-aware on web).
- Every animated primitive checks reduce-motion (RN `AccessibilityInfo.isReduceMotionEnabled` / web `prefers-reduced-motion`) and degrades to cross-fade/instant.

## 9. Testing

- `tokens`: extend `theme.test.ts` for `gradientPrimary`/`glow`/`motion` on every scheme; unit-test `createTheme` white-label derivation.
- Components: render/state tests for `Button` variants, `Toast` lifecycle, `StatusChip` mapping (unit-tested against the lifecycle enum).
- Keep existing dashboard auth + mobile logic tests green.

## 10. Non-goals

- No backend/contract/DB/migration/env changes.
- No new screens or features — visual + motion only.
- No change to navigation structure, the booking state machine, or the white-label override API surface (only additive derivation).
- No removal of the dark-app / light-dashboard split.

## Open assumptions (confirmed with user)

- Keep mobile dark / dashboard light.
- Derive white-label gradient/glow from `primary`/`primaryDark` rather than requiring providers to specify them.
