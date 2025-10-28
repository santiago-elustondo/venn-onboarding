import { useState, useCallback } from "react"
import { isValidNorthAmericaPhoneNumber } from "@/components/ui/phone-input"
import { parsePhoneNumber } from "react-phone-number-input"

export interface UsePhoneFieldReturn {
  value: string
  onChange: (value: string | undefined) => void
  onBlur: () => void
  onFocus: () => void
  isValid: boolean
  isTouched: boolean
  error?: string | null
  e164: string | null
  reset: () => void
  touch: () => void
}

export function usePhoneField(): UsePhoneFieldReturn {
  const [value, setValue] = useState('')
  const [isTouched, setIsTouched] = useState(false)
  const [hasError, setHasError] = useState(false)

  const onChange = useCallback((newValue: string | undefined) => {
    setValue(newValue || '')
    // Clear error state on change
    if (hasError) {
      setHasError(false)
    }
  }, [hasError])

  const onBlur = useCallback(() => {
    setIsTouched(true)
    // Trigger validation on blur - use current state value
    setValue(currentValue => {
      const isCurrentlyValid = isValidNorthAmericaPhoneNumber(currentValue)
      if (!isCurrentlyValid) { // Show error for both empty and invalid
        setHasError(true)
      }
      return currentValue
    })
  }, [])

  const onFocus = useCallback(() => {
    // Clear error state on focus
    setHasError(false)
  }, [])

  const reset = useCallback(() => {
    setValue('')
    setIsTouched(false)
    setHasError(false)
  }, [])

  const touch = useCallback(() => {
    setIsTouched(true)
  }, [])

  const isValid = isValidNorthAmericaPhoneNumber(value)
  const error = hasError && !isValid ? (value ? 'Invalid' : 'Required') : null
  
  const e164 = (() => {
    if (!isValid || !value) return null
    try {
      // Try parsing without specifying country since it could be US or CA
      const parsed = parsePhoneNumber(value)
      return parsed?.format('E.164') || null
    } catch {
      return null
    }
  })()

  return {
    value,
    onChange,
    onBlur,
    onFocus,
    isValid,
    isTouched,
    error,
    e164,
    reset,
    touch
  }
}