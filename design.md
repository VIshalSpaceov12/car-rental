# Car Rental Platform — Design System (`design.md`)

Single source of truth for the **centralized** tokens (color, spacing, type, radius,
elevation, z-index, motion) across mobile + dashboard. Tokens live in
`@car-rental/tokens`, consumed via `useTheme()`. Components never inline a hex/px/font/
duration — semantics only (lint-enforced). See `CLAUDE.md › Design system`.

**Brand:** "Midnight GT" — dark-first premium night UI: deepened near-black canvas,
frosted-glass cards, an **ember→red** accent gradient (`#FF8A3D → #FF3B30`) with a soft red
glow, white text, gold rating stars. The dashboard uses the light sibling (data-dense,
legible admin). `defaultTheme` = **dark**. Visual source of truth (the agreed mockup):
`docs/design-explorations/direction-1-midnight-gt.html`.

## Token structure

Layered so a reskin never disturbs layout, and a new brand/scheme is one file:

```
primitives.ts     PRIVATE raw ramps — palette{neutral,red,gold,green,alert}, alpha,
                  space[], radii, fontSize, fontFamily. Never exported.
themes/dark.ts    ColorScheme (brand default, this image)
themes/light.ts   ColorScheme (sibling — same red brand, light surfaces)
theme.ts          Theme · ColorScheme · TextStyle · ElevationStyle types;
                  STATIC tokens (spacing/radius/typography/elevation/zIndex);
                  createTheme(scheme) · darkTheme · lightTheme · defaultTheme=dark
index.ts          public surface (primitives stay private)
```

Private primitives → semantic `ColorScheme` per scheme → `Theme` assembled with shared
static tokens. A missing role is a **compile error**, not a runtime blank. Names are
semantic (`primary`, `surfaceAlt`), never literal (`red500`).

**App wiring:** mobile → `darkTheme` (matches the design; `StatusBar` light) ·
dashboard → `lightTheme` (same red brand, legible admin) · `defaultTheme` = dark.

## Color — themeable (the only themeable layer)

**Dark scheme (brand default):**

| Role | Hex | Use |
|------|-----|-----|
| `primary` | `#FF453A` | red FABs, active tab, CTAs, accents |
| `primaryDark` | `#D42E26` | pressed/gradient |
| `onPrimary` | `#FFFFFF` | text/icon on red |
| `background` | `#08080A` | app canvas |
| `surface` | `#141417` | cards |
| `surfaceAlt` | `#1C1C21` | tiles, inputs, icon circles |
| `text` | `#FFFFFF` | headings, prices |
| `textMuted` | `#9A9AA2` | subtitles |
| `textSubtle` | `#6E6E76` | meta / disabled |
| `border` | `#2A2A30` | hairlines, tile edges |
| `danger` | `#FF453A` | errors, rejected/cancelled |
| `success` | `#34D399` | confirmed, paid, OTP success |
| `warning` | `#FBBF24` | gold rating stars |
| `overlay` | `rgba(0,0,0,0.55)` | photo scrims, modal backdrops |
| `gradientPrimary` | `['#FF8A3D', '#FF3B30']` | accent gradient (FAB/hero CTA) |
| `glow` | `rgba(255,69,58,0.35)` | accent glow / focus halo |

**Light scheme (sibling — dashboard):** `background #FFFFFF` · `surface #F5F5F7` ·
`surfaceAlt #ECECEF` · `text #121214` · `textMuted #55555C` · `textSubtle #8A8A92` ·
`border #C9C9CF` · `overlay rgba(0,0,0,0.25)` (lighter admin scrim) · `gradientPrimary
['#FF8A3D','#FF3B30']` · `glow rgba(255,69,58,0.28)`. Brand (`primary`/`primaryDark`/gradient)
+ status hues are identical across schemes — only neutrals flip, so light/dark is just
another color set.

White-on-`primary` ≈ **4.35:1** — passes AA for large text / UI components (buttons,
large labels); avoid small body copy directly on red. Dark/light is the themeable axis
plus per-provider white-label overrides.

**White-label:** `createTheme(scheme, brandOverrides?)` merges a provider's
`primary`/`primaryDark` over a scheme; when the override omits `gradientPrimary`/`glow`,
they're **derived** (`gradientPrimary = [primary, primaryDark]`, `glow = primary @ 0.35`)
so existing branding configs get a coherent gradient + glow for free. The Midnight GT
default keeps its hand-picked ember→red gradient.

## Spacing · Type · Radius · Elevation · Z-index (static, semantic)

Access as `theme.spacing.*` / `theme.typography.*` / `theme.radius.*` etc. — never raw
numbers. Font sizes live **inside** type roles, not as a free scale. RTL: logical props
only (`marginInline`, `paddingStart/End`).

| Spacing | px | | Type role | size/wt/lh | | Radius | px |
|---|---|---|---|---|---|---|---|
| `none` | 0 | | `display` | 56/800/60 (ls −1) | | `sm` | 10 |
| `xs` | 4 | | `heading` | 28/700/34 | | `md` | 16 |
| `sm` | 8 | | `title` | 20/600/26 | | `lg` | 24 |
| `md` | 16 | | `subtitle` | 15/500/20 | | `xl` | 32 |
| `lg` | 24 | | `body` | 16/400/24 | | `card` | 24 |
| `xl` | 32 | | `caption` | 13/400/18 | | `pill` | 999 |
| `xxl` | 48 | | `label` | 13/600/16 | | | |
| | | | *family* | `System` (themeable) | | | |

Radii match the Midnight GT mockup (softer, more rounded than the original scale).

**Elevation** (`none/sm/md/lg`) — framework-agnostic `{shadowColor, shadowOpacity,
shadowRadius, shadowOffset, elevation}`; RN consumes directly, web maps to `box-shadow`
(elevation ≠ box-shadow). **Z-index**: `base 0 · card 1 · header 10 · overlay 100 ·
modal 1000 · toast 2000`.

**Size** (`theme.size`, static) — cross-component dimensions so no component inlines a raw
width/size: `icon{xs14·sm16·md18·lg20·xl22·xxl24·hero32}` · `control{sm40·md52·lg60}` (circular
buttons/FABs) · `touchTarget 44`. One-off layout dimensions (a specific card height) stay as
named consts in the component, not as tokens.

**Enforcement:** primitives private (not re-exported); every scheme satisfies
`ColorScheme`, every theme `Theme` (missing role = compile error); tokens resolve at
runtime via `ThemeProvider`; lint fails a raw `#fff`/`16`; mobile + dashboard share role
names.

## Component layers (mobile — `apps/mobile/src/components/`)

primitives → composed → screens; each layer knows only the one below. Thin screens
compose; props-driven theming, variants over copy-paste, no literals.

| Layer | Components |
|---|---|
| **Primitives** | `Button` (gradient fill + glow + `spring.press`) · `TextField` · `Icon` · `CircleButton` · `Avatar` (gradient + glow) · `Toast` (in-house) · `Skeleton` (shimmer) · `StatusChip` (tinted + dot) · `AnimatedListItem` · `UnlockButton` (OTP hero) |
| **Composed** | `RatingBadge` (pill) · `SectionHeader` · `FeatureTile` · `CtaBar` · `ScreenHeader` · `CarHeroCard` (Top-Trends hero) · `CarTrendCard` · `CarListCard` (compact row) · `FloatingTabBar` |
| **Screens** | `Onboarding` · `Home` (`BrowseScreen`: search pill + hero + list) · `Details` · `Booking` · `Pickup` (OTP unlock) · `Bookings` |

Dashboard mirrors the same vocabulary on web (framer-motion): `Button` · `Toast` · `Skeleton`
· `StatusChip` · `AnimatedRow`/`AnimatedTableBody` · `TitleRow`, plus the sidebar (gradient
logo + nav icons + user chip), count-up stat cards (sparkline + trend), and the bookings table.

**Navigation:** `@react-navigation/bottom-tabs` (v6) with the custom `FloatingTabBar`
(floating pill, active = red circle); root native-stack themed to the dark palette;
onboarding gates the unauthed flow. Dashboard keeps the same component vocabulary/prop
contracts on web.

## Motion & animation

**Runtime:** mobile → `react-native-reanimated` (+ `react-native-gesture-handler` for
swipe, `expo-linear-gradient` for fills); dashboard → `framer-motion`. **Toast is in-house**
(no third-party toast lib). Mobile animation libs need a native rebuild (not a JS-only OTA).
Motion tokens are centralized (no magic numbers) and **static**.

**Motion tokens** (live on `Theme.motion`): `duration.fast` 120 · `base` 200 · `slow` 320 ·
`hero` 480 ms; `easing.standard` `[0.2,0,0,1]` / `enter` `[0,0,0,1]` / `exit` `[0.4,0,1,1]` /
`spring` `[0.34,1.56,0.64,1]` (overshoot for press/FAB/tab-indicator/stagger);
`spring.press` `{ damping 18, stiffness 240, mass 0.8 }`.

| Moment | Animation |
|--------|-----------|
| Screen transitions | platform push; slide-up modal for booking/checkout |
| Button / CarCard press | scale 0.97 + lift, `spring.press` |
| List/detail load | skeleton shimmer (no spinner) → cross-fade |
| Booking status change | status-chip color+label cross-fade on realtime event |
| **Toast** | in-house: slide-down, auto-dismiss, swipe to clear |
| **OTP unlock (hero)** | lock→unlock morph (`duration.hero`) + success toast |

**OTP feedback = the in-house toast, not a third-party integration** — also the standard
channel for payment/error feedback. **RTL:** slide directions flip in AR.
**Reduce-motion:** fall back to cross-fade/instant.

## Status

**Done:** Midnight GT recolor (dark default + light sibling) · `gradientPrimary` + `glow`
themeable roles with white-label derivation · `motion` tokens (`duration`/`easing`+`spring`)
· mockup-aligned radii · animation runtime wired (Reanimated/gesture-handler/expo-linear-gradient
on mobile, framer-motion on dashboard) · in-house `Toast` · `Skeleton` · `StatusChip` ·
`UnlockButton` OTP hero · per-provider white-label color overrides · mobile screens
(Browse search-pill + hero + compact list, Pickup OTP) + dashboard (sidebar identity,
count-up stat cards, bookings table) aligned to `docs/design-explorations/direction-1-midnight-gt.html`.

**Next:**
- [ ] Mobile native rebuild + on-device smoke test (the animation libs aren't a JS-only OTA).
- [ ] AR/RTL + reduce-motion pass on device for the new screens.
- [ ] Real `rating`/`trips` on the `Vehicle` contract (cards use deterministic placeholders).
- [ ] Real fleet-utilization % + MTD-revenue data for the dashboard stat cards (currently demo values).
- [ ] Pre-existing raw-px lint errors in `apps/dashboard/src/features/logs/LogsScreen.tsx` (out of scope here).
