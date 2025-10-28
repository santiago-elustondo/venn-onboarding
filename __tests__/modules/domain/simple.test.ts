/**
 * Tests for simple field validation
 */

import { 
  isValidName, 
  isValidPhoneCA, 
  getNameValidationError, 
  getPhoneValidationError 
} from "@/modules/domain/simple";

describe("Simple Field Validation", () => {
  describe("isValidName", () => {
    it("should return true for valid names", () => {
      expect(isValidName("John")).toBe(true);
      expect(isValidName("Mary Jane")).toBe(true);
      expect(isValidName("José")).toBe(true);
      expect(isValidName("Van Der Berg")).toBe(true);
      expect(isValidName("O'Connor")).toBe(true);
      expect(isValidName("李明")).toBe(true); // Chinese characters
    });

    it("should return false for empty or whitespace-only names", () => {
      expect(isValidName("")).toBe(false);
      expect(isValidName("   ")).toBe(false);
      expect(isValidName("\t\n")).toBe(false);
    });

    it("should return false for names exceeding 50 characters", () => {
      const longName = "a".repeat(51);
      expect(isValidName(longName)).toBe(false);
      
      const exactlyFifty = "a".repeat(50);
      expect(isValidName(exactlyFifty)).toBe(true);
    });

    it("should handle leading/trailing whitespace correctly", () => {
      expect(isValidName("  John  ")).toBe(true);
      expect(isValidName("\tMary\n")).toBe(true);
    });
  });

  describe("isValidPhoneCA", () => {
    it("should return true for valid Canadian phone numbers", () => {
      expect(isValidPhoneCA("+13062776103")).toBe(true);
      expect(isValidPhoneCA("+14165551234")).toBe(true);
      expect(isValidPhoneCA("+19991234567")).toBe(true);
      expect(isValidPhoneCA("+10001234567")).toBe(true);
    });

    it("should return false for invalid phone numbers", () => {
      expect(isValidPhoneCA("")).toBe(false);
      expect(isValidPhoneCA("3062776103")).toBe(false); // Missing country code
      expect(isValidPhoneCA("13062776103")).toBe(false); // Missing +
      expect(isValidPhoneCA("+1306277610")).toBe(false); // Too short
      expect(isValidPhoneCA("+130627761033")).toBe(false); // Too long
      expect(isValidPhoneCA("+23062776103")).toBe(false); // Wrong country code
      expect(isValidPhoneCA("+1306-277-6103")).toBe(false); // Contains dashes
      expect(isValidPhoneCA("+1 306 277 6103")).toBe(false); // Contains spaces
      expect(isValidPhoneCA("1-306-277-6103")).toBe(false); // Wrong format
    });

    it("should be strict about format", () => {
      expect(isValidPhoneCA("(306) 277-6103")).toBe(false);
      expect(isValidPhoneCA("306.277.6103")).toBe(false);
      expect(isValidPhoneCA("306 277 6103")).toBe(false);
    });
  });

  describe("getNameValidationError", () => {
    it("should return appropriate error messages", () => {
      expect(getNameValidationError("")).toBe("Name is required");
      expect(getNameValidationError("   ")).toBe("Name is required");
      
      const longName = "a".repeat(51);
      expect(getNameValidationError(longName)).toBe("Name must be 50 characters or less");
      
      // Valid names should still return the generic error message (this function is called only when invalid)
      expect(getNameValidationError("ValidName")).toBe("Invalid name");
    });
  });

  describe("getPhoneValidationError", () => {
    it("should return appropriate error messages for different invalid formats", () => {
      expect(getPhoneValidationError("")).toBe("Phone number is required");
      expect(getPhoneValidationError("3062776103")).toBe("Phone number must start with +1 (Canadian country code)");
      expect(getPhoneValidationError("+130627761")).toBe("Phone number must be +1 followed by 10 digits");
      expect(getPhoneValidationError("+130627761033")).toBe("Phone number must be +1 followed by 10 digits");
      expect(getPhoneValidationError("+1306-277-6103")).toBe("Phone number must be +1 followed by 10 digits"); // 14 chars, fails length check first
      expect(getPhoneValidationError("+1abcdefghij")).toBe("Phone number contains invalid characters"); // 12 chars but invalid
      expect(getPhoneValidationError("+23062776103")).toBe("Phone number must start with +1 (Canadian country code)");
    });
  });
});