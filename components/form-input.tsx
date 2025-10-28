"use client"

/**
 * Pure UI component for form input with error display
 */

import React from "react"
import { Check, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/tailwind"

interface FormInputProps {
  id: string
  label: string
  type?: string
  value: string
  error?: string
  touched?: boolean
  isValid?: boolean
  isLoading?: boolean
  maxLength?: number
  placeholder?: string
  onChange: (value: string) => void
  onBlur: () => void
  onFocus?: () => void
  disabled?: boolean
  "data-testid"?: string
}

export function FormInput({
  id,
  label,
  type = "text",
  value,
  error,
  touched,
  isValid,
  isLoading,
  maxLength,
  placeholder,
  onChange,
  onBlur,
  onFocus,
  disabled,
  "data-testid": dataTestId,
}: FormInputProps) {
  const showError = touched && error
  const showValid = isValid && value && !showError

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium flex items-center gap-2">
        {label}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" data-testid="loading-spinner" />
        )}
        {!isLoading && showValid && (
          <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
        )}
        {!isLoading && showError && (
          <span id={`${id}-error`} className="text-sm text-destructive" role="alert" data-testid={`${id}-error`}>
            {error}
          </span>
        )}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={dataTestId}
        hasError={!!showError}
        aria-invalid={showError ? "true" : "false"}
        aria-describedby={showError ? `${id}-error` : undefined}
      />
    </div>
  )
}
