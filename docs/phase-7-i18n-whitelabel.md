# Phase 7 — i18n (EN + AR) + white-label

**Goal (DEMO_PLAN §Phase 7):** full Arabic + RTL, and a brand switcher.

**Status:** implemented across `api`, `dashboard`, `mobile`. No Prisma migration
(`Provider` already stores `name`/`logoUrl`/`colors`), no new env vars, no new deps.

## i18n (EN + AR + RTL)

- **Real Arabic.** Both `ar.json` catalogs were English copies; every value is now
  genuine Modern Standard Arabic (interpolation placeholders preserved). The only
  intentionally-Latin value is the "English" entry in each language picker.
- **Runtime language switcher:**
  - **Dashboard:** an EN/AR control in the sidebar → `i18n.changeLanguage` + persist
    to `localStorage`; `document.dir`/`lang` flip via the existing `languageChanged`
    listener (no reload). Startup boots to the persisted locale.
  - **Mobile:** an EN/AR switcher in `SettingsScreen` → `i18n.changeLanguage` +
    persist to `expo-secure-store` + `I18nManager.forceRTL`. Text updates instantly;
    because RN only applies `forceRTL` after a reload, a **restart prompt** is shown
    only when the direction actually flips. Startup loads persisted → device → `en`.
- **Parity tests:** the dashboard gained an EN/AR key-parity test (mirroring the
  mobile one); both stay green against the real Arabic.

## White-label branding

- **API (new, TDD):** `PATCH /branding` *(service-provider)* — updates the caller's
  own `Provider` `name`/`logoUrl`/`colors`; returns `ProviderBranding`. Role-gated
  (403 customer), validated (name + primary required). New type
  `UpdateBrandingRequest`. No migration.
- **Dashboard:** a **Branding** settings section (name, logo URL, primary /
  primaryDark / background, with a live preview) → saves via the mutation → updates
  `auth.branding` in the store, so the active theme **re-themes instantly** through
  the existing `resolveTheme`/`ThemeProvider`.
- **Mobile:** branding already flows from `GET /branding` → `ThemeProvider`. Added
  pull-to-refresh (shared RTK Query cache) so an updated brand re-themes the app
  live without a restart.

## Decisions

1. **Arabic produced as MSA in-repo** — far better than the English stubs; native QA
   would normally follow before production.
2. **Mobile RTL via restart prompt**, not an auto-reload dependency.
3. **Logo is a URL field** (no upload UI; S3/Cloudinary deferred).
4. **True multi-tenant mobile deferred** — one provider configures its brand and it
   applies on the dashboard (their session) + the single-brand mobile app. Host/
   subdomain provider resolution remains a later concern.

## Testing

- API: `PATCH /branding` — update + persistence (via `GET /auth/me`), null logo,
  role (403), auth (401), validation (400).
- Dashboard: branding-form component test + EN/AR parity test.
- Mobile: EN/AR parity test against the real Arabic.

## Deferred

Logo/asset upload (S3/Cloudinary); host/subdomain multi-tenant brand resolution;
native-speaker Arabic QA.
