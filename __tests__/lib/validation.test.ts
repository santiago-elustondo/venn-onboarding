import {
  onboardingSchema,
  validateFirstName,
  validateLastName,
  validatePhone,
  validateCorporationNumber,
} from "@/lib/validation"

describe("Validation", () => {
  describe("validateFirstName", () => {
    it("should return null for valid first name", () => {
      expect(validateFirstName("John")).toBeNull()
      expect(validateFirstName("Mary Jane")).toBeNull()
    })

    it("should return error for empty first name", () => {
      expect(validateFirstName("")).toBe("First name is required")
    })

    it("should return error for first name exceeding 50 characters", () => {
      const longName = "a".repeat(51)
      expect(validateFirstName(longName)).toBe("First name must be 50 characters or less")
    })
  })

  describe("validateLastName", () => {
    it("should return null for valid last name", () => {
      expect(validateLastName("Doe")).toBeNull()
      expect(validateLastName("Van Der Berg")).toBeNull()
    })

    it("should return error for empty last name", () => {
      expect(validateLastName("")).toBe("Last name is required")
    })

    it("should return error for last name exceeding 50 characters", () => {
      const longName = "a".repeat(51)
      expect(validateLastName(longName)).toBe("Last name must be 50 characters or less")
    })
  })

  describe("validatePhone", () => {
    it("should return null for valid Canadian phone numbers", () => {
      expect(validatePhone("13062776103")).toBeNull()
      expect(validatePhone("+13062776103")).toBeNull()
      expect(validatePhone("14165551234")).toBeNull()
    })

    it("should return error for invalid phone numbers", () => {
      expect(validatePhone("")).toBe("Phone number is required")
      expect(validatePhone("1234567890")).toContain("Invalid Canadian phone number")
      expect(validatePhone("23062776103")).toContain("Invalid Canadian phone number")
      expect(validatePhone("1-306-277-6103")).toContain("Invalid Canadian phone number")
      expect(validatePhone("306-277-6103")).toContain("Invalid Canadian phone number")
    })
  })

  describe("validateCorporationNumber", () => {
    it("should return null for valid corporation number format", () => {
      expect(validateCorporationNumber("123456789")).toBeNull()
      expect(validateCorporationNumber("826417395")).toBeNull()
    })

    it("should return error for invalid corporation number", () => {
      expect(validateCorporationNumber("")).toBe("Corporation number is required")
      expect(validateCorporationNumber("12345678")).toBe("Corporation number must be exactly 9 characters")
      expect(validateCorporationNumber("1234567890")).toBe("Corporation number must be exactly 9 characters")
    })
  })

  describe("onboardingSchema", () => {
    it("should validate complete valid form data", () => {
      const validData = {
        firstName: "John",
        lastName: "Doe",
        phone: "13062776103",
        corporationNumber: "123456789",
      }
      expect(() => onboardingSchema.parse(validData)).not.toThrow()
    })

    it("should reject invalid form data", () => {
      const invalidData = {
        firstName: "",
        lastName: "",
        phone: "invalid",
        corporationNumber: "123",
      }
      expect(() => onboardingSchema.parse(invalidData)).toThrow()
    })
  })
})
