"use client"

/**
 * Pure UI component for form input with error display
 */

import React from "react"
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
  maxLength?: number
  placeholder?: string
  onChange: (value: string) => void
  onBlur: () => void
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
  maxLength,
  placeholder,
  onChange,
  onBlur,
  disabled,
  "data-testid": dataTestId,
}: FormInputProps) {
  const showError = touched && error

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={dataTestId}
        className={cn(showError && "border-destructive focus-visible:ring-destructive")}
        aria-invalid={showError ? "true" : "false"}
        aria-describedby={showError ? `${id}-error` : undefined}
      />
      {showError && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert" data-testid={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
