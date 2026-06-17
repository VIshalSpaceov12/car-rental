import { ImageBackground, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { CtaBar } from '../../components/CtaBar'
import { AnimatedListItem } from '../../components/AnimatedListItem'

// Placeholder hero; swap for branded art / a remote campaign image later.
const HERO_IMAGE = 'https://picsum.photos/seed/car-rental-hero/900/1600'

// Slightly knocked-back hero numeral so it reads as a backdrop, not foreground.
const HERO_NUMERAL_OPACITY = 0.92

/** Pre-auth landing: full-bleed hero, oversized "911", headline, Get Started. */
export function OnboardingScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  return (
    <ImageBackground
      source={{ uri: HERO_IMAGE }}
      style={{ flex: 1, backgroundColor: theme.color.background }}
      resizeMode="cover"
    >
      <View
        style={{
          flex: 1,
          backgroundColor: theme.color.overlay,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.xl,
          paddingBottom: insets.bottom + theme.spacing.lg,
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: theme.color.text,
            fontSize: theme.typography.display.fontSize,
            fontWeight: theme.typography.display.fontWeight,
            letterSpacing: theme.typography.display.letterSpacing,
            textAlign: 'center',
            marginTop: theme.spacing.xxl,
            opacity: HERO_NUMERAL_OPACITY,
          }}
        >
          911
        </Text>

        <AnimatedListItem index={1}>
          <View style={{ gap: theme.spacing.md }}>
            <Text
              style={{
                color: theme.color.text,
                fontSize: theme.typography.heading.fontSize,
                fontWeight: theme.typography.heading.fontWeight,
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
              <CtaBar label={t('onboarding.getStarted')} icon="car" onPress={onGetStarted} />
            </View>
          </View>
        </AnimatedListItem>
      </View>
    </ImageBackground>
  )
}
