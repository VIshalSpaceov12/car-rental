import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Enforce the CLAUDE.md "avoid any" rule.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Design-system discipline (CLAUDE.md / design.md): UI components never inline
    // a raw hex color or a raw px dimension — everything resolves through the
    // semantic tokens in `@car-rental/tokens` via `useTheme()`. Backend config
    // (apps/api) legitimately holds default brand hex, so this is UI-app only.
    files: ['apps/mobile/src/**/*.{ts,tsx}', 'apps/dashboard/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.*', '**/*.d.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            'No raw hex colors in UI code — use a semantic color token from useTheme() (theme.color.*).',
        },
        {
          selector:
            "Property[key.name=/^(width|height|minWidth|maxWidth|minHeight|maxHeight|borderRadius|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius|fontSize|lineHeight|gap|rowGap|columnGap|padding|paddingTop|paddingBottom|paddingHorizontal|paddingVertical|paddingStart|paddingEnd|margin|marginTop|marginBottom|marginHorizontal|marginVertical|marginStart|marginEnd|top|bottom|start|end)$/] > Literal[raw=/^([2-9]|[1-9][0-9]+)$/]",
          message:
            'No raw px dimensions in UI styles — use theme.spacing.*/radius.*/size.* tokens, or a named module const for a one-off layout dimension.',
        },
      ],
    },
  },
  {
    // RN/Expo tooling configs are CommonJS Node scripts.
    files: ['**/babel.config.js', '**/jest.config.js', '**/metro.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        exports: 'writable',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
)
