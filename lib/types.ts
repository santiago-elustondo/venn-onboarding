export interface OnboardingFormData {
  firstName: string
  lastName: string
  phone: string
  corporationNumber: string
}

export interface FieldError {
  message: string
}

export interface FormErrors {
  firstName?: FieldError
  lastName?: FieldError
  phone?: FieldError
  corporationNumber?: FieldError
  submit?: FieldError
}

export interface CorporationValidationResponse {
  corporationNumber?: string
  valid: boolean
  message?: string
}

export interface SubmitResponse {
  success: boolean
  message?: string
}
