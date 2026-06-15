import { useTranslation } from 'react-i18next'
import type { UpdateBrandingRequest } from '@car-rental/types'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setBranding } from '../../store/authSlice'
import { useUpdateBrandingMutation } from '../../store/authApi'
import { BrandingForm } from './BrandingForm'

/**
 * Container for the white-label branding editor: prefills from `auth.branding`,
 * persists via `PATCH /branding`, and on success pushes the returned branding into
 * the auth slice so `resolveTheme`/`ThemeProvider` re-themes the dashboard live.
 */
export function BrandingPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const branding = useAppSelector((s) => s.auth.branding)
  const [updateBranding, { isLoading, isSuccess, isError }] = useUpdateBrandingMutation()

  const save = async (body: UpdateBrandingRequest) => {
    try {
      const updated = await updateBranding(body).unwrap()
      dispatch(setBranding(updated))
    } catch {
      // Surfaced via the mutation's isError flag → status line below.
    }
  }

  const status = isSuccess
    ? ({ kind: 'success', message: t('branding.saved') } as const)
    : isError
      ? ({ kind: 'error', message: t('branding.saveFailed') } as const)
      : null

  return <BrandingForm branding={branding} saving={isLoading} status={status} onSave={save} />
}
