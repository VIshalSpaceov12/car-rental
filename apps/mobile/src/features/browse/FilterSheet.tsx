import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { FuelType, Transmission, VehicleFilters } from '@car-rental/types'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { useCategoriesQuery } from '../../store/fleetApi'

// Filter enums paired with their (typed) translation keys; explicit keys keep
// `t()` type-checked against the catalog instead of a dynamic `${string}` key.
const TRANSMISSIONS: { value: Transmission; labelKey: 'filters.transmissionAutomatic' | 'filters.transmissionManual' }[] = [
  { value: 'automatic', labelKey: 'filters.transmissionAutomatic' },
  { value: 'manual', labelKey: 'filters.transmissionManual' },
]
const FUEL_TYPES: { value: FuelType; labelKey: 'filters.fuelPetrol' | 'filters.fuelDiesel' | 'filters.fuelElectric' | 'filters.fuelHybrid' }[] = [
  { value: 'petrol', labelKey: 'filters.fuelPetrol' },
  { value: 'diesel', labelKey: 'filters.fuelDiesel' },
  { value: 'electric', labelKey: 'filters.fuelElectric' },
  { value: 'hybrid', labelKey: 'filters.fuelHybrid' },
]

// Cap the scrollable option area so the sheet never grows past the screen.
const OPTIONS_MAX_HEIGHT = 360

/** Parse a price field to a positive number, or undefined when blank/invalid. */
const toPrice = (text: string): number | undefined => {
  const n = Number(text.trim())
  return text.trim() && Number.isFinite(n) && n >= 0 ? n : undefined
}

/**
 * Minimal filter sheet. Edits a local copy of the active `VehicleFilters` and
 * commits it on Apply; `available` is owned by the screen and preserved here.
 */
export function FilterSheet({
  visible,
  initial,
  onApply,
  onClose,
}: {
  visible: boolean
  initial: VehicleFilters
  onApply: (filters: VehicleFilters) => void
  onClose: () => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const { data: categories = [] } = useCategoriesQuery()

  const [categoryId, setCategoryId] = useState(initial.categoryId)
  const [transmission, setTransmission] = useState(initial.transmission)
  const [fuelType, setFuelType] = useState(initial.fuelType)
  const [minPrice, setMinPrice] = useState(initial.minPrice != null ? String(initial.minPrice) : '')
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice != null ? String(initial.maxPrice) : '')

  const apply = () => {
    onApply({
      available: initial.available,
      categoryId,
      transmission,
      fuelType,
      minPrice: toPrice(minPrice),
      maxPrice: toPrice(maxPrice),
    })
  }

  const reset = () => {
    setCategoryId(undefined)
    setTransmission(undefined)
    setFuelType(undefined)
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: theme.color.overlay }} onPress={onClose} />
      <View
        style={{
          backgroundColor: theme.color.surface,
          borderTopStartRadius: theme.radius.xl,
          borderTopEndRadius: theme.radius.xl,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: '700' }}>
            {t('filters.title')}
          </Text>
          <Pressable onPress={reset} hitSlop={8} accessibilityRole="button">
            <Text style={{ color: theme.color.primary }}>{t('filters.reset')}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: OPTIONS_MAX_HEIGHT }}>
          <ChipGroup
            label={t('filters.category')}
            options={[
              { value: undefined, label: t('filters.anyCategory') },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            selected={categoryId}
            onSelect={setCategoryId}
          />

          <ChipGroup
            label={t('filters.transmission')}
            options={[
              { value: undefined, label: t('filters.any') },
              ...TRANSMISSIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
            ]}
            selected={transmission}
            onSelect={setTransmission}
          />

          <ChipGroup
            label={t('filters.fuelType')}
            options={[
              { value: undefined, label: t('filters.any') },
              ...FUEL_TYPES.map((o) => ({ value: o.value, label: t(o.labelKey) })),
            ]}
            selected={fuelType}
            onSelect={setFuelType}
          />

          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('filters.minPrice')}
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('filters.maxPrice')}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholder="500"
              />
            </View>
          </View>
        </ScrollView>

        <Button title={t('filters.apply')} onPress={apply} />
      </View>
    </Modal>
  )
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: { value: T | undefined; label: string }[]
  selected: T | undefined
  onSelect: (value: T | undefined) => void
}) {
  const theme = useTheme()
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing.sm }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {options.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <Pressable
              key={opt.label}
              onPress={() => onSelect(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={{
                paddingVertical: theme.spacing.xs,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.pill,
                backgroundColor: isSelected ? theme.color.primary : theme.color.surfaceAlt,
              }}
            >
              <Text style={{ color: isSelected ? theme.color.onPrimary : theme.color.text }}>{opt.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
