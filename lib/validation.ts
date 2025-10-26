import { z } from "zod"

// Canadian phone number validation
// Must start with 1 (country code), can have optional + at start
// Total length should be 11 digits (1 + 10 digit number)
const phoneRegex = /^\+?1\d{10}$/

export const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be 50 characters or less").trim(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be 50 characters or less").trim(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Invalid Canadian phone number. Must start with 1 and be 11 digits total"),
  corporationNumber: z
    .string()
    .min(1, "Corporation number is required")
    .length(9, "Corporation number must be exactly 9 characters"),
})

export type OnboardingFormSchema = z.infer<typeof onboardingSchema>

// Individual field validators for on-blur validation
export const validateFirstName = (value: string) => {
  try {
    onboardingSchema.shape.firstName.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    return "Invalid first name"
  }
}

export const validateLastName = (value: string) => {
  try {
    onboardingSchema.shape.lastName.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    return "Invalid last name"
  }
}

export const validatePhone = (value: string) => {
  try {
    onboardingSchema.shape.phone.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    return "Invalid phone number"
  }
}

export const validateCorporationNumber = (value: string) => {
  try {
    onboardingSchema.shape.corporationNumber.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    return "Invalid corporation number"
  }
}
