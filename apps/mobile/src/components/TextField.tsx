import { type TextInputProps } from 'react-native'
import { TextInput } from './TextInput'

/**
 * Labelled form field — kept as a thin alias over the unified {@link TextInput}
 * so existing auth/booking/rating forms keep their `label`-required API while
 * sharing the one light input style. New code should prefer `TextInput`.
 */
export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  return <TextInput label={label} {...props} />
}
