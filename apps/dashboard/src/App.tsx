import { ThemeProvider, useTheme, defaultTheme } from '@car-rental/tokens'

function Home() {
  const theme = useTheme()
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: theme.color.background,
        fontFamily: theme.typography.body.fontFamily,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: theme.color.primary, fontSize: theme.typography.heading.fontSize }}>
          Car Rental — dashboard
        </h1>
        <p style={{ color: theme.color.textMuted }}>Skeleton booting via @car-rental/tokens</p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <Home />
    </ThemeProvider>
  )
}
