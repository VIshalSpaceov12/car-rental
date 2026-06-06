import type { InputHTMLAttributes } from 'react'
import { useTheme } from '@car-rental/tokens'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function TextField({ label, style, ...props }: Props) {
  const theme = useTheme()
  return (
    <label style={{ display: 'block', marginBottom: theme.spacing.md }}>
      <span
        style={{
          display: 'block',
          color: theme.color.text,
          marginBottom: theme.spacing.xs,
          fontSize: theme.typography.body.fontSize,
        }}
      >
        {label}
      </span>
      <input
        {...props}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: theme.spacing.sm,
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.color.textMuted}`,
          fontSize: theme.typography.body.fontSize,
          ...style,
        }}
      />
    </label>
  )
}
