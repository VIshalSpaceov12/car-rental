import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider, defaultTheme } from '@car-rental/tokens'
import type { ProviderBranding } from '@car-rental/types'
import { BrandingForm } from './BrandingForm'

const branding: ProviderBranding = {
  name: 'Acme Rentals',
  logoUrl: 'https://example.com/logo.png',
  colors: { primary: '#c81e1e', primaryDark: '#7f1010', background: '#fafafa' },
}

function renderForm(overrides: Partial<React.ComponentProps<typeof BrandingForm>> = {}) {
  const onSave = vi.fn()
  render(
    <ThemeProvider theme={defaultTheme}>
      <BrandingForm branding={branding} saving={false} onSave={onSave} {...overrides} />
    </ThemeProvider>,
  )
  return { onSave }
}

describe('BrandingForm', () => {
  it('prefills the fields from the current branding', () => {
    renderForm()
    expect(screen.getByDisplayValue('Acme Rentals')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/logo.png')).toBeInTheDocument()
    // Each color has a picker well + a hex field sharing the value; assert the
    // labelled hex field so the well's matching value doesn't make it ambiguous.
    expect(screen.getByLabelText('Primary color')).toHaveValue('#c81e1e')
    expect(screen.getByLabelText('Primary (dark)')).toHaveValue('#7f1010')
    expect(screen.getByLabelText('Background color')).toHaveValue('#fafafa')
  })

  it('fires onSave with the entered values, dropping empty optional colors to undefined', () => {
    const { onSave } = renderForm({
      branding: { name: 'Old', logoUrl: null, colors: { primary: '#000000' } },
    })

    fireEvent.change(screen.getByDisplayValue('Old'), { target: { value: 'New Co' } })
    fireEvent.change(screen.getByLabelText('Primary color'), { target: { value: '#112233' } })

    fireEvent.click(screen.getByRole('button', { name: /save branding/i }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      name: 'New Co',
      logoUrl: null,
      colors: { primary: '#112233' },
    })
  })

  it('does not submit when name or primary color is empty', () => {
    const { onSave } = renderForm({
      branding: { name: '', logoUrl: null, colors: { primary: '' } },
    })
    fireEvent.click(screen.getByRole('button', { name: /save branding/i }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('renders the save status when provided', () => {
    renderForm({ status: { kind: 'success', message: 'Branding saved.' } })
    expect(screen.getByRole('status')).toHaveTextContent('Branding saved.')
  })
})
