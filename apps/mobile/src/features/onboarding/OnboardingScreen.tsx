import { Image, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Button } from '../../components/Button'
import { AnimatedListItem } from '../../components/AnimatedListItem'

// Placeholder hero; swap for branded art / a remote campaign image later.
const HERO_IMAGE = 'https://picsum.photos/seed/car-rental-hero/900/1100'
// Hero photo fills the upper portion of the canvas above the headline block.
const HERO_FLEX = 3
const CONTENT_FLEX = 2

/**
 * Pre-auth landing in the minimal language: a light canvas, a premium hero photo
 * filling the top, then a bold ink headline, muted subtitle, and an ink primary
 * "Get Started" CTA.
 */
export function OnboardingScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.color.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + theme.spacing.lg,
      }}
    >
      <View style={{ flex: HERO_FLEX, padding: theme.spacing.lg }}>
        <Image
          source={{ uri: HERO_IMAGE }}
          style={{
            flex: 1,
            width: '100%',
            borderRadius: theme.radius.card,
            backgroundColor: theme.color.surfaceAlt,
          }}
          resizeMode="cover"
        />
      </View>

      <AnimatedListItem index={1}>
        <View style={{ flex: CONTENT_FLEX, paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md, justifyContent: 'center' }}>
          <Text
            style={{
              color: theme.color.text,
              fontSize: theme.typography.heading.fontSize,
              fontWeight: '800',
              lineHeight: theme.typography.heading.lineHeight,
            }}
          >
            {t('onboarding.headline')}
          </Text>
          <Text
            style={{
              color: theme.color.textMuted,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
            }}
          >
            {t('onboarding.subtitle')}
          </Text>
          <View style={{ marginTop: theme.spacing.sm }}>
            <Button title={t('onboarding.getStarted')} icon="car" onPress={onGetStarted} />
          </View>
        </View>
      </AnimatedListItem>
    </View>
  )
}
