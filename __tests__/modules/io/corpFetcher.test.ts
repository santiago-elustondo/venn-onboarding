/**
 * Tests for the corporation number fetcher I/O adapter
 */

import { corpFetcher } from "@/modules/io/corpFetcher";
import type { PlausibleCorpNo } from "@/modules/domain/corpNo";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Corporation Fetcher I/O Adapter", () => {
  let abortController: AbortController;

  beforeEach(() => {
    jest.clearAllMocks();
    abortController = new AbortController();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("successful validation", () => {
    it("should return valid result for successful API response", async () => {
      const mockResponse = {
        valid: true,
        corporationNumber: "123456789"
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await corpFetcher("123456789" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "valid",
        corporationNumber: "123456789"
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://fe-hometask-api.qa.vault.tryvault.com/corporation-number/123456789",
        expect.objectContaining({
          headers: { Accept: "application/json" }
        })
      );
    });

    it("should handle legacy response format with corporationNumber field", async () => {
      const mockResponse = {
        corporationNumber: "826417395"
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await corpFetcher("826417395" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "valid",
        corporationNumber: "826417395"
      });
    });
  });

  describe("invalid corporation numbers", () => {
    it("should return invalid result for API response with valid: false", async () => {
      const mockResponse = {
        valid: false,
        message: "Corporation number not found in registry"
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await corpFetcher("999999999" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "invalid",
        message: "Corporation number not found in registry"
      });
    });

    it("should handle 404 responses as invalid", async () => {
      const mockErrorResponse = {
        message: "Corporation number not found"
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      const result = await corpFetcher("999999999" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "invalid",
        message: "Corporation number not found"
      });
    });

    it("should handle 400 responses as invalid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid format" }),
      });

      const result = await corpFetcher("123456789" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "invalid",
        message: "Invalid format"
      });
    });
  });

  describe("error handling", () => {
    it("should return server error for 500 responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await corpFetcher("123456789" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "error",
        error: "server",
        message: "Server error (500)"
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const result = await corpFetcher("123456789" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "error",
        error: "network",
        message: "Network connection failed"
      });
    });

    it("should handle timeout errors", async () => {
      // Mock a timeout error directly
      mockFetch.mockRejectedValueOnce(new Error("timeout"));

      const result = await corpFetcher("123456789" as PlausibleCorpNo, abortController.signal);

      expect(result).toEqual({
        kind: "error",
        error: "timeout", 
        message: "Request timed out"
      });
    }, 10000);
  });

  describe("abort handling", () => {
    it("should handle abort signal correctly", async () => {
      const controller = new AbortController();
      
      mockFetch.mockImplementationOnce(async () => {
        // Simulate the fetch being aborted
        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        throw error;
      });

      controller.abort();

      await expect(
        corpFetcher("123456789" as PlausibleCorpNo, controller.signal)
      ).rejects.toThrow("The operation was aborted");
    });
  });
});