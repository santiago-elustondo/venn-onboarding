import * as React from "react"
import PhoneInput from "react-phone-number-input/input"
import { isValidPhoneNumber } from "react-phone-number-input"
import { cn } from "@/lib/utils"

export interface PhoneInputProps {
  id?: string
  value?: string
  onChange?: (value: string | undefined) => void
  onBlur?: () => void
  onFocus?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
  "aria-invalid"?: boolean
  hasError?: boolean
}

export function isValidNorthAmericaPhoneNumber(phoneNumber: string | undefined): boolean {
  if (!phoneNumber) return false
  // Check if it's valid for either US or Canada (both use +1 country code)
  return isValidPhoneNumber(phoneNumber, 'US') || isValidPhoneNumber(phoneNumber, 'CA')
}

const PhoneInputComponent = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, onBlur, onFocus, hasError, ...props }, ref) => {
    const handleChange = React.useCallback((value?: string) => {
      onChange?.(value)
    }, [onChange])

    return (
      <PhoneInput
        ref={ref}
        defaultCountry="US"
        countries={['US', 'CA']}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        className={cn(
          // Base styles
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          
          // Blue focus state (only highlight)
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          
          className
        )}
        {...props}
      />
    )
  }
)
PhoneInputComponent.displayName = "PhoneInput"

export { PhoneInputComponent as PhoneInput }
