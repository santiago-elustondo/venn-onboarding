/**
 * Tests for the profile details submission I/O adapter
 */

import { postProfileDetails } from "@/modules/io/postProfileDetails";
import type { ProfileDetailsPayload } from "@/modules/io/postProfileDetails";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Profile Details Submission I/O Adapter", () => {
  let abortController: AbortController;
  let mockPayload: ProfileDetailsPayload;

  beforeEach(() => {
    jest.clearAllMocks();
    abortController = new AbortController();
    jest.useFakeTimers();

    mockPayload = {
      firstName: "John",
      lastName: "Doe",
      corporationNumber: "123456789" as any, // PlausibleCorpNo
      phone: "+13062776103"
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("successful submission", () => {
    it("should return success for 200 OK response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({ ok: true });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://fe-hometask-api.qa.vault.tryvault.com/profile-details",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            firstName: "John",
            lastName: "Doe",
            phone: "+13062776103",
            corporationNumber: "123456789",
          }),
        })
      );
    });

    it("should trim whitespace from names", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const payloadWithWhitespace = {
        ...mockPayload,
        firstName: "  John  ",
        lastName: "  Doe  ",
      };

      await postProfileDetails(payloadWithWhitespace, abortController.signal);

      const callArgs = mockFetch.mock.calls[0][1];
      const sentPayload = JSON.parse(callArgs.body);
      
      expect(sentPayload.firstName).toBe("John");
      expect(sentPayload.lastName).toBe("Doe");
    });
  });

  describe("error responses", () => {
    it("should handle 400 bad request", async () => {
      const errorResponse = {
        message: "Invalid phone number format"
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "Invalid phone number format"
      });
    });

    it("should handle 409 conflict", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => { throw new Error("Invalid JSON"); },
      });

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "This information has already been submitted."
      });
    });

    it("should handle 500 server error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error("Invalid JSON"); },
      });

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "Server error occurred. Please try again later."
      });
    });

    it("should handle error with JSON response", async () => {
      const errorResponse = {
        message: "Corporation number is invalid"
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => errorResponse,
      });

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "Corporation number is invalid"
      });
    });

    it("should fallback to status-based messages when JSON parsing fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => { throw new Error("Invalid JSON"); },
      });

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "Request failed with status 422"
      });
    });
  });

  describe("network and timeout errors", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "Network connection failed. Please check your internet connection."
      });
    });

    it("should handle timeout errors", async () => {
      // Mock a timeout error directly
      const timeoutError = new Error("Request timed out");
      timeoutError.name = "TimeoutError";
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "Request timed out. Please try again."
      });
    }, 10000);

    it("should handle unexpected errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Something went wrong"));

      const result = await postProfileDetails(mockPayload, abortController.signal);

      expect(result).toEqual({
        ok: false,
        message: "An unexpected error occurred. Please try again."
      });
    });
  });

  describe("abort handling", () => {
    it("should handle abort signal correctly", async () => {
      const controller = new AbortController();
      
      mockFetch.mockImplementationOnce(async () => {
        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        throw error;
      });

      controller.abort();

      await expect(
        postProfileDetails(mockPayload, controller.signal)
      ).rejects.toThrow("The operation was aborted");
    });
  });
});