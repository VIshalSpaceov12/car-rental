import { useState } from 'react'
import { I18nManager, Modal, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { Icon } from './Icon'
import { addMonths, buildMonthGrid, formatYmd, parseYmd, todayYmd } from './dateGrid'

/**
 * Labelled date field: a read-only box styled like {@link TextInput} that opens a
 * month-grid calendar. Emits the same `YYYY-MM-DD` strings the booking draft
 * already collects, so callers, validation and the API contract are unchanged.
 * Token-driven and RTL-aware (logical row direction + mirrored nav chevrons);
 * `minDate` (`YYYY-MM-DD`) dims and blocks earlier days.
 */
export function DateField({
  label,
  value,
  onChange,
  minDate,
  placeholder,
}: {
  label: string
  value: string
  onChange: (ymd: string) => void
  minDate?: string
  placeholder?: string
}) {
  const theme = useTheme()
  const { t } = useTranslation()
  const months = t('booking.calendar.months', { returnObjects: true }) as string[]
  const weekdays = t('booking.calendar.weekdays', { returnObjects: true }) as string[]

  const selected = parseYmd(value)
  const today = todayYmd()
  // The month to land on when opening: the selection, else the min date, else today.
  const anchor = () => {
    const a = selected ?? parseYmd(minDate ?? '') ?? parseYmd(today)!
    return { year: a.year, month0: a.month0 }
  }
  const [open, setOpen] = useState(false)
  // Month the grid is showing (day-agnostic).
  const [view, setView] = useState(anchor)

  const display = selected ? `${selected.day} ${months[selected.month0]} ${selected.year}` : null

  const openPicker = () => {
    setView(anchor())
    setOpen(true)
  }

  const pick = (day: number) => {
    onChange(formatYmd(view.year, view.month0, day))
    setOpen(false)
  }

  const grid = buildMonthGrid(view.year, view.month0)
  // chevron-back/forward already point inline-start/end; mirror under RTL.
  const flip = { transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text
        style={{
          color: theme.color.text,
          marginBottom: theme.spacing.xs,
          fontSize: theme.typography.label.fontSize,
          fontWeight: theme.typography.label.fontWeight,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: theme.color.surface,
          borderWidth: 1,
          borderColor: open ? theme.color.primary : theme.color.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
        }}
      >
        <Icon name="calendar" size={theme.size.icon.md} color={theme.color.textSubtle} />
        <Text
          style={{
            flex: 1,
            color: display ? theme.color.text : theme.color.textSubtle,
            fontSize: theme.typography.body.fontSize,
          }}
        >
          {display ?? placeholder ?? ''}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: theme.color.overlay,
            justifyContent: 'center',
            padding: theme.spacing.lg,
          }}
        >
          {/* Stop propagation so taps inside the card don't dismiss it. */}
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.color.background,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              ...theme.elevation.lg,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.md,
              }}
            >
              <Pressable
                onPress={() => setView(addMonths(view.year, view.month0, -1))}
                hitSlop={theme.spacing.sm}
                accessibilityRole="button"
              >
                <View style={flip}>
                  <Icon name="back" size={theme.size.icon.md} color={theme.color.text} />
                </View>
              </Pressable>
              <Text
                style={{
                  color: theme.color.text,
                  fontSize: theme.typography.title.fontSize,
                  fontWeight: theme.typography.title.fontWeight,
                }}
              >
                {`${months[view.month0]} ${view.year}`}
              </Text>
              <Pressable
                onPress={() => setView(addMonths(view.year, view.month0, 1))}
                hitSlop={theme.spacing.sm}
                accessibilityRole="button"
              >
                <View style={flip}>
                  <Icon name="chevron" size={theme.size.icon.md} color={theme.color.text} />
                </View>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: theme.spacing.xs }}>
              {weekdays.map((w, i) => (
                <Text
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    color: theme.color.textSubtle,
                    fontSize: theme.typography.caption.fontSize,
                  }}
                >
                  {w}
                </Text>
              ))}
            </View>

            {grid.map((week, wi) => (
              <View key={wi} style={{ flexDirection: 'row' }}>
                {week.map((day, di) => {
                  if (day === null) return <View key={di} style={{ flex: 1, aspectRatio: 1 }} />
                  const ymd = formatYmd(view.year, view.month0, day)
                  const isSelected = ymd === value
                  const isDisabled = minDate ? ymd < minDate : false
                  const isToday = ymd === today
                  return (
                    <Pressable
                      key={di}
                      disabled={isDisabled}
                      onPress={() => pick(day)}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: theme.spacing.xs,
                        borderRadius: theme.radius.pill,
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: theme.color.primary,
                        backgroundColor: isSelected ? theme.color.primary : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          color: isDisabled
                            ? theme.color.textSubtle
                            : isSelected
                              ? theme.color.onPrimary
                              : theme.color.text,
                          fontSize: theme.typography.body.fontSize,
                          fontWeight: isSelected ? '700' : '400',
                          opacity: isDisabled ? 0.4 : 1,
                        }}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
