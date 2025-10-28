/**
 * Tests for the corporation number domain logic
 */

import { 
  whyNotPlausibleCorpNo, 
  isPlausibleCorpNo, 
  toPlausibleCorpNo, 
  formatCorpNoLocalIssue,
  type CorpNoLocalIssue 
} from "@/modules/domain/corpNo";

describe("Corporation Number Domain", () => {
  describe("whyNotPlausibleCorpNo", () => {
    it("should return null for valid 9-digit numbers", () => {
      expect(whyNotPlausibleCorpNo("123456789")).toBeNull();
      expect(whyNotPlausibleCorpNo("000000000")).toBeNull();
      expect(whyNotPlausibleCorpNo("999999999")).toBeNull();
    });

    it("should return 'empty' for empty string", () => {
      expect(whyNotPlausibleCorpNo("")).toBe("empty");
    });

    it("should return 'contains_non_digit' for non-numeric characters", () => {
      expect(whyNotPlausibleCorpNo("12345678a")).toBe("contains_non_digit");
      expect(whyNotPlausibleCorpNo("abc123456")).toBe("contains_non_digit");
      expect(whyNotPlausibleCorpNo("123-456-789")).toBe("contains_non_digit");
      expect(whyNotPlausibleCorpNo("123 456 789")).toBe("contains_non_digit");
    });

    it("should return 'too_short' for strings shorter than 9 digits", () => {
      expect(whyNotPlausibleCorpNo("1")).toBe("too_short");
      expect(whyNotPlausibleCorpNo("12345")).toBe("too_short");
      expect(whyNotPlausibleCorpNo("12345678")).toBe("too_short");
    });

    it("should return 'too_long' for strings longer than 9 digits", () => {
      expect(whyNotPlausibleCorpNo("1234567890")).toBe("too_long");
      expect(whyNotPlausibleCorpNo("12345678901")).toBe("too_long");
    });
  });

  describe("isPlausibleCorpNo", () => {
    it("should return true for valid corporation numbers", () => {
      expect(isPlausibleCorpNo("123456789")).toBe(true);
      expect(isPlausibleCorpNo("826417395")).toBe(true);
      expect(isPlausibleCorpNo("000000000")).toBe(true);
    });

    it("should return false for invalid corporation numbers", () => {
      expect(isPlausibleCorpNo("")).toBe(false);
      expect(isPlausibleCorpNo("12345")).toBe(false);
      expect(isPlausibleCorpNo("1234567890")).toBe(false);
      expect(isPlausibleCorpNo("12345678a")).toBe(false);
      expect(isPlausibleCorpNo("123-456-789")).toBe(false);
    });
  });

  describe("toPlausibleCorpNo", () => {
    it("should return PlausibleCorpNo for valid strings", () => {
      const result = toPlausibleCorpNo("123456789");
      expect(result).toBe("123456789");
      
      const result2 = toPlausibleCorpNo("826417395");
      expect(result2).toBe("826417395");
    });

    it("should throw for invalid strings", () => {
      expect(() => toPlausibleCorpNo("")).toThrow("Required");
      expect(() => toPlausibleCorpNo("12345")).toThrow("9 digits");
      expect(() => toPlausibleCorpNo("12345678a")).toThrow("Only digits");
      expect(() => toPlausibleCorpNo("1234567890")).toThrow("9 digits");
    });
  });

  describe("formatCorpNoLocalIssue", () => {
    it("should format all issue types correctly", () => {
      expect(formatCorpNoLocalIssue("empty")).toBe("Required");
      expect(formatCorpNoLocalIssue("contains_non_digit")).toBe("Only digits");
      expect(formatCorpNoLocalIssue("too_short")).toBe("9 digits");
      expect(formatCorpNoLocalIssue("too_long")).toBe("9 digits");
    });

    it("should handle all possible CorpNoLocalIssue values", () => {
      const issues: CorpNoLocalIssue[] = ["empty", "contains_non_digit", "too_short", "too_long"];
      
      issues.forEach(issue => {
        expect(() => formatCorpNoLocalIssue(issue)).not.toThrow();
        expect(typeof formatCorpNoLocalIssue(issue)).toBe("string");
        expect(formatCorpNoLocalIssue(issue).length).toBeGreaterThan(0);
      });
    });
  });
});