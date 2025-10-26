import { validateCorporationNumberAPI, submitProfileDetails } from "@/lib/api"
import jest from "jest"

describe("API Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("validateCorporationNumberAPI", () => {
    it("should return valid response for valid corporation number", async () => {
      const mockResponse = {
        corporationNumber: "123456789",
        valid: true,
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await validateCorporationNumberAPI("123456789")
      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        "https://fe-hometask-api.qa.vault.tryvault.com/corporation-number/123456789",
      )
    })

    it("should return invalid response for invalid corporation number", async () => {
      const mockResponse = {
        valid: false,
        message: "Invalid corporation number",
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await validateCorporationNumberAPI("999999999")
      expect(result).toEqual(mockResponse)
    })

    it("should handle network errors", async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

      const result = await validateCorporationNumberAPI("123456789")
      expect(result).toEqual({
        valid: false,
        message: "Network error occurred",
      })
    })
  })

  describe("submitProfileDetails", () => {
    it("should return success for valid submission", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const formData = {
        firstName: "John",
        lastName: "Doe",
        phone: "13062776103",
        corporationNumber: "123456789",
      }

      const result = await submitProfileDetails(formData)
      expect(result).toEqual({ success: true })
      expect(global.fetch).toHaveBeenCalledWith("https://fe-hometask-api.qa.vault.tryvault.com/profile-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
    })

    it("should return error for failed submission", async () => {
      const mockError = { message: "Invalid phone number" }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      })

      const formData = {
        firstName: "John",
        lastName: "Doe",
        phone: "invalid",
        corporationNumber: "123456789",
      }

      const result = await submitProfileDetails(formData)
      expect(result).toEqual({
        success: false,
        message: "Invalid phone number",
      })
    })

    it("should handle network errors", async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

      const formData = {
        firstName: "John",
        lastName: "Doe",
        phone: "13062776103",
        corporationNumber: "123456789",
      }

      const result = await submitProfileDetails(formData)
      expect(result).toEqual({
        success: false,
        message: "Network error occurred",
      })
    })
  })
})
