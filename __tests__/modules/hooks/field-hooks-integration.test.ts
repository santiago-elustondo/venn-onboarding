/**
 * Simplified hook integration tests focusing on actual implementation
 * Tests basic functionality with real validators
 */

import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSimpleField } from "@/modules/fields/useSimpleField";
import { useCorpNoField } from "@/modules/fields/useCorpNoField";
import { isValidName, isValidPhoneCA } from "@/modules/domain/simple";

// Mock the corp fetcher
const mockFetchCorpNo = jest.fn();
jest.mock("@/modules/io/corpFetcher", () => ({
  fetchCorpNo: mockFetchCorpNo,
}));

describe("Field State Machine Hooks - Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("useSimpleField with real validators", () => {
    it("should validate name fields correctly", () => {
      const { result } = renderHook(() => 
        useSimpleField({ validator: isValidName, idleMs: 600 })
      );

      expect(result.current.state.tag).toBe("empty");

      // Enter valid name
      act(() => {
        result.current.onChange("John");
      });

      expect(result.current.state.tag).toBe("active");

      // Trigger evaluation
      act(() => {
        result.current.evaluate();
      });

      expect(result.current.state.tag).toBe("valid");
      expect(result.current.isValid).toBe(true);
    });

    it("should detect invalid names", () => {
      const { result } = renderHook(() => 
        useSimpleField({ validator: isValidName, idleMs: 600 })
      );

      // Enter empty name
      act(() => {
        result.current.onChange("   ");
      });

      act(() => {
        result.current.evaluate();
      });

      expect(result.current.state.tag).toBe("invalid");
      expect(result.current.isValid).toBe(false);
    });

    it("should validate phone fields correctly", () => {
      const { result } = renderHook(() => 
        useSimpleField({ validator: isValidPhoneCA, idleMs: 600 })
      );

      // Enter valid Canadian phone
      act(() => {
        result.current.onChange("+13062776103");
      });

      act(() => {
        result.current.evaluate();
      });

      expect(result.current.state.tag).toBe("valid");
      expect(result.current.isValid).toBe(true);
    });

    it("should detect invalid phone format", () => {
      const { result } = renderHook(() => 
        useSimpleField({ validator: isValidPhoneCA, idleMs: 600 })
      );

      // Enter invalid format
      act(() => {
        result.current.onChange("3062776103");
      });

      act(() => {
        result.current.evaluate();
      });

      expect(result.current.state.tag).toBe("invalid");
      expect(result.current.isValid).toBe(false);
    });

    it("should handle idle timeout validation", () => {
      const { result } = renderHook(() => 
        useSimpleField({ validator: isValidName, idleMs: 600 })
      );

      act(() => {
        result.current.onChange("John");
      });

      expect(result.current.state.tag).toBe("active");

      // Wait for idle timeout
      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.state.tag).toBe("valid");
    });

    it("should handle blur evaluation after touch", () => {
      const { result } = renderHook(() => 
        useSimpleField({ validator: isValidName, idleMs: 600 })
      );

      // Type and then blur
      act(() => {
        result.current.onChange("John");
      });

      act(() => {
        result.current.onBlur();
      });

      // Blur triggers evaluation in next tick
      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.isTouched).toBe(true);
      expect(result.current.state.tag).toBe("valid");
    });
  });

  describe("useCorpNoField basic functionality", () => {
    it("should initialize properly", () => {
      const { result } = renderHook(() => useCorpNoField({
        fetcher: mockFetchCorpNo,
        idleMs: 600
      }));

      expect(result.current.state.tag).toBe("empty");
      expect(result.current.state.value).toBe("");
      expect(result.current.isValid).toBe(false);
      expect(result.current.isTouched).toBe(false);
    });

    it("should handle input changes", () => {
      const { result } = renderHook(() => useCorpNoField({
        fetcher: mockFetchCorpNo,
        idleMs: 600
      }));

      act(() => {
        result.current.onChange("123456789");
      });

      expect(result.current.state.tag).toBe("active");
      expect(result.current.state.value).toBe("123456789");
      expect(result.current.isTouched).toBe(true);
    });

    it("should detect implausible corp numbers", () => {
      const { result } = renderHook(() => useCorpNoField({
        fetcher: mockFetchCorpNo,
        idleMs: 600
      }));

      // Enter too short number
      act(() => {
        result.current.onChange("12345");
      });

      act(() => {
        result.current.onBlur();
      });

      // Blur triggers evaluation in next tick
      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.state.tag).toBe("implausible");
      expect(result.current.state.localIssue).toBeTruthy();
    });

    it("should handle clearing input", () => {
      const { result } = renderHook(() => useCorpNoField({
        fetcher: mockFetchCorpNo,
        idleMs: 600
      }));

      act(() => {
        result.current.onChange("123456789");
      });

      act(() => {
        result.current.onChange("");
      });

      expect(result.current.state.tag).toBe("empty");
      expect(result.current.state.value).toBe("");
    });

    it("should provide reset functionality", () => {
      const { result } = renderHook(() => useCorpNoField({
        fetcher: mockFetchCorpNo,
        idleMs: 600
      }));

      act(() => {
        result.current.onChange("123456789");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.tag).toBe("empty");
      expect(result.current.state.value).toBe("");
    });
  });

  describe("Edge cases and cleanup", () => {
    it("should handle unmounting gracefully", () => {
      const { result, unmount } = renderHook(() => 
        useSimpleField({ validator: isValidName, idleMs: 600 })
      );

      // First trigger some active state
      act(() => {
        result.current.onChange("test");
      });
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it("should handle rapid input changes", () => {
      const { result } = renderHook(() => 
        useSimpleField({ validator: isValidName, idleMs: 600 })
      );

      // Simulate rapid typing
      act(() => {
        result.current.onChange("J");
      });
      act(() => {
        result.current.onChange("Jo");
      });
      act(() => {
        result.current.onChange("Joh");
      });
      act(() => {
        result.current.onChange("John");
      });

      expect(result.current.state.tag).toBe("active");
      expect(result.current.state.value).toBe("John");
    });
  });
});