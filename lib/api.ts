import type { CorporationValidationResponse, OnboardingFormData, SubmitResponse } from "./types"

const API_BASE_URL = "https://fe-hometask-api.qa.vault.tryvault.com"

export async function validateCorporationNumberAPI(corporationNumber: string): Promise<CorporationValidationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/corporation-number/${corporationNumber}`)

    if (!response.ok) {
      return { valid: false, message: "Failed to validate corporation number" }
    }

    const data = await response.json()
    return data
  } catch (error) {
    return { valid: false, message: "Network error occurred" }
  }
}

export async function submitProfileDetails(data: OnboardingFormData): Promise<SubmitResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile-details`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      return { success: true }
    }

    const errorData = await response.json()
    return {
      success: false,
      message: errorData.message || "Submission failed",
    }
  } catch (error) {
    return {
      success: false,
      message: "Network error occurred",
    }
  }
}
