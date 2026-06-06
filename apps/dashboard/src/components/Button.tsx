import type { ButtonHTMLAttributes } from 'react'
import { useTheme } from '@car-rental/tokens'

export function Button({ children, style, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const theme = useTheme()
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        background: disabled ? theme.color.textMuted : theme.color.primary,
        color: theme.color.onPrimary,
        border: 'none',
        borderRadius: theme.radius.md,
        padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
        fontSize: theme.typography.body.fontSize,
        cursor: disabled ? 'default' : 'pointer',
        width: '100%',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
