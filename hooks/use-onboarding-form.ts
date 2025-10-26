"use client"

/**
 * Custom hook for managing onboarding form state and validation
 */

import { useState, useCallback } from "react"
import type { OnboardingFormData, FormErrors } from "@/lib/types"
import {
  validateFirstName,
  validateLastName,
  validatePhone,
  validateCorporationNumber,
  onboardingSchema,
} from "@/lib/validation"
import { validateCorporationNumberAPI, submitProfileDetails } from "@/lib/api"

interface UseOnboardingFormReturn {
  formData: OnboardingFormData
  errors: FormErrors
  touched: Record<keyof OnboardingFormData, boolean>
  isValidating: boolean
  isSubmitting: boolean
  handleChange: (field: keyof OnboardingFormData, value: string) => void
  handleBlur: (field: keyof OnboardingFormData) => Promise<void>
  handleSubmit: () => Promise<boolean>
  resetForm: () => void
}

const initialFormData: OnboardingFormData = {
  firstName: "",
  lastName: "",
  phone: "",
  corporationNumber: "",
}

export function useOnboardingForm(): UseOnboardingFormReturn {
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<keyof OnboardingFormData, boolean>>({
    firstName: false,
    lastName: false,
    phone: false,
    corporationNumber: false,
  })
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((field: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const validateField = useCallback(
    async (field: keyof OnboardingFormData): Promise<string | null> => {
      const value = formData[field]

      switch (field) {
        case "firstName":
          return validateFirstName(value)
        case "lastName":
          return validateLastName(value)
        case "phone":
          return validatePhone(value)
        case "corporationNumber": {
          // First check format
          const formatError = validateCorporationNumber(value)
          if (formatError) {
            return formatError
          }
          // Then validate via API
          setIsValidating(true)
          try {
            const result = await validateCorporationNumberAPI(value)
            if (!result.valid) {
              return result.message || "Invalid corporation number"
            }
            return null
          } finally {
            setIsValidating(false)
          }
        }
        default:
          return null
      }
    },
    [formData],
  )

  const handleBlur = useCallback(
    async (field: keyof OnboardingFormData) => {
      setTouched((prev) => ({ ...prev, [field]: true }))

      const error = await validateField(field)
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: { message: error } }))
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [validateField],
  )

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      corporationNumber: true,
    })

    // Validate all fields
    const newErrors: FormErrors = {}

    // Validate with Zod schema first
    try {
      onboardingSchema.parse(formData)
    } catch (error: any) {
      error.errors?.forEach((err: any) => {
        const field = err.path[0] as keyof OnboardingFormData
        newErrors[field] = { message: err.message }
      })
    }

    // If basic validation passes, validate corporation number via API
    if (!newErrors.corporationNumber && formData.corporationNumber) {
      setIsValidating(true)
      try {
        const result = await validateCorporationNumberAPI(formData.corporationNumber)
        if (!result.valid) {
          newErrors.corporationNumber = { message: result.message || "Invalid corporation number" }
        }
      } finally {
        setIsValidating(false)
      }
    }

    // If there are validation errors, set them and return false
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }

    // Submit the form
    setIsSubmitting(true)
    try {
      const result = await submitProfileDetails(formData)
      if (result.success) {
        return true
      } else {
        setErrors({ submit: { message: result.message || "Submission failed" } })
        return false
      }
    } catch (error) {
      setErrors({ submit: { message: "An unexpected error occurred" } })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setErrors({})
    setTouched({
      firstName: false,
      lastName: false,
      phone: false,
      corporationNumber: false,
    })
  }, [])

  return {
    formData,
    errors,
    touched,
    isValidating,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  }
}
