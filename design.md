# Car Rental Platform — Design System (`design.md`)

Single source of truth for the **centralized** tokens (color, spacing, type, radius,
elevation, z-index, motion) across mobile + dashboard. Tokens live in
`@car-rental/tokens`, consumed via `useTheme()`. Components never inline a hex/px/font/
duration — semantics only (lint-enforced). See `CLAUDE.md › Design system`.

**Brand:** dark-first, racing-red — a premium night UI (near-black canvas, layered grey
cards, vivid red accents, white text, gold rating stars). `defaultTheme` = **dark**.

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
| `primary` | `#E5322B` | red FABs, active tab, CTAs, accents |
| `primaryDark` | `#C9261E` | pressed/gradient |
| `onPrimary` | `#FFFFFF` | text/icon on red |
| `background` | `#0A0A0B` | app canvas |
| `surface` | `#161618` | cards |
| `surfaceAlt` | `#1F1F22` | tiles, inputs, icon circles |
| `text` | `#FFFFFF` | headings, prices |
| `textMuted` | `#9A9AA2` | subtitles |
| `textSubtle` | `#76767E` | meta / disabled |
| `border` | `#2A2A2E` | hairlines, tile edges |
| `danger` | `#FF4438` | errors, rejected/cancelled |
| `success` | `#32C36A` | confirmed, paid, OTP success |
| `warning` | `#FFBF3F` | gold rating stars |
| `overlay` | `rgba(0,0,0,0.55)` | photo scrims, modal backdrops |

**Light scheme (sibling):** `background #FFFFFF` · `surface #F5F5F7` · `surfaceAlt #ECECEF`
· `text #121214` · `textMuted #55555C` · `textSubtle #76767E` · `border #C9C9CF` ·
`overlay rgba(0,0,0,0.45)`. Brand (`primary`/`primaryDark`) + status hues are identical
across schemes — only neutrals flip, so light/dark is just another color set.

White-on-`primary` ≈ **4.35:1** — passes AA for large text / UI components (buttons,
large labels); avoid small body copy directly on red. Dark/light is the themeable axis
plus future per-provider white-label overrides.

## Spacing · Type · Radius · Elevation · Z-index (static, semantic)

Access as `theme.spacing.*` / `theme.typography.*` / `theme.radius.*` etc. — never raw
numbers. Font sizes live **inside** type roles, not as a free scale. RTL: logical props
only (`marginInline`, `paddingStart/End`).

| Spacing | px | | Type role | size/wt/lh | | Radius | px |
|---|---|---|---|---|---|---|---|
| `none` | 0 | | `display` | 56/800/60 (ls −1) | | `sm` | 8 |
| `xs` | 4 | | `heading` | 28/700/34 | | `md` | 12 |
| `sm` | 8 | | `title` | 20/600/26 | | `lg` | 16 |
| `md` | 16 | | `subtitle` | 15/500/20 | | `xl` | 20 |
| `lg` | 24 | | `body` | 16/400/24 | | `card` | 16 |
| `xl` | 32 | | `caption` | 13/400/18 | | `pill` | 999 |
| `xxl` | 48 | | `label` | 13/600/16 | | | |
| | | | *family* | `System` (themeable) | | | |

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
| **Primitives** | `Button` · `TextField` · `Icon` (curated `@expo/vector-icons` set) · `CircleButton` (variants `primary`/`surface`/`glass`, sizes sm/md/lg) · `Avatar` |
| **Composed** | `RatingBadge` · `SectionHeader` · `FeatureTile` · `CtaBar` · `ScreenHeader` · `CarTrendCard` · `CarListCard` · `FloatingTabBar` |
| **Screens** | `Onboarding` (hero) · `Home` (`BrowseScreen`) · `Details` (`VehicleDetailScreen`) · `Bookings`/`Settings` (tab placeholders) |

**Navigation:** `@react-navigation/bottom-tabs` (v6) with the custom `FloatingTabBar`
(floating pill, active = red circle); root native-stack themed to the dark palette;
onboarding gates the unauthed flow. Dashboard keeps the same component vocabulary/prop
contracts on web.

## Motion & animation (spec — not yet built)

RN/Expo built-ins (Animated/Reanimated) + React Navigation transitions. **No third-party
animation or toast lib.** Motion tokens are centralized (no magic numbers) and **static**.

**Motion tokens** (to add to `Theme`): `duration.fast` 120 · `base` 200 · `slow` 320 ·
`hero` 480 ms; `easing.standard/enter/exit`; `spring.press` (snappy).

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

**Done:** dark default + light sibling · expanded type roles (`display`→`label`) ·
`elevation` + `zIndex` scales · component library + Onboarding/Home/Details screens +
tab nav.

**Next:**
- [ ] Add `motion` tokens to `Theme`; build the in-house `Toast` primitive.
- [ ] Real `rating`/`trips` on the `Vehicle` contract (cards use deterministic placeholders).
- [ ] Richer Details specs (acceleration, climate, charge-%) — need backend fields.
- [ ] Per-provider white-label color overrides (brand schemes beyond dark/light).
- [ ] AR/RTL pass on the new screens.
