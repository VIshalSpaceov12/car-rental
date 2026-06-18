import { I18nManager, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Icon, type IconName } from './Icon'

// Header control diameter — a one-off layout dimension for the round back/action.
const CONTROL_DIM = 40
const CONTROL_ICON_RATIO = 0.45

/** Round, subtle header control (back chevron / heart / search). */
function HeaderControl({ icon, label, onPress, mirror }: { icon: IconName; label: string; onPress: () => void; mirror?: boolean }) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: CONTROL_DIM,
        height: CONTROL_DIM,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.surface,
        borderWidth: 1,
        borderColor: theme.color.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={mirror && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
        <Icon name={icon} size={Math.round(CONTROL_DIM * CONTROL_ICON_RATIO)} color={theme.color.text} />
      </View>
    </Pressable>
  )
}

/**
 * Screen header: a back chevron (mirrored in RTL) on the inline-start, an optional
 * centered title, and an optional trailing action (search / heart). Omitting a
 * side renders a spacer so the title stays centered.
 */
export function ScreenHeader({
  title,
  onBack,
  actionIcon,
  onAction,
  actionLabel,
}: {
  title?: string
  onBack?: () => void
  actionIcon?: IconName
  onAction?: () => void
  actionLabel?: string
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {onBack ? (
        <HeaderControl icon="back" label={t('common.goBack')} onPress={onBack} mirror />
      ) : (
        <View style={{ width: CONTROL_DIM }} />
      )}

      {title ? (
        <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}>
          {title}
        </Text>
      ) : (
        <View />
      )}

      {actionIcon && onAction ? (
        <HeaderControl icon={actionIcon} label={actionLabel ?? title ?? t('common.done')} onPress={onAction} />
      ) : (
        <View style={{ width: CONTROL_DIM }} />
      )}
    </View>
  )
}
