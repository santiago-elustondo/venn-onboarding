/**
 * Corporation number validation I/O adapter
 * 
 * Handles remote validation of corporation numbers with proper error handling,
 * cancellation support, and typed responses.
 */

import type { PlausibleCorpNo } from "../domain/corpNo";
import { API_BASE_URL } from "./config";
import { withTimeoutSignal } from "./abort";

export type CorpNoValidationResult =
  | { kind: "valid"; corporationNumber: PlausibleCorpNo }
  | { kind: "invalid"; message: string }
  | { kind: "error"; error: "network" | "timeout" | "server"; message?: string };

export type CorpNoFetcher = (
  cn: PlausibleCorpNo,
  signal: AbortSignal
) => Promise<CorpNoValidationResult>;

/**
 * Default implementation of corporation number fetcher
 * Uses the existing API endpoint with enhanced error handling
 */
export const corpFetcher: CorpNoFetcher = async (corporationNumber, signal) => {
  try {
    const { signal: combinedSignal, cleanup } = withTimeoutSignal(signal, 10000);
    const response = await fetch(`${API_BASE_URL}/corporation-number/${corporationNumber}`,
      {
        signal: combinedSignal,
        headers: { Accept: 'application/json' },
      });
    cleanup();
    
    if (!response.ok) {
      if (response.status >= 500) {
        return {
          kind: "error",
          error: "server",
          message: `Server error (${response.status})`
        };
      }
      
      if (response.status === 404 || response.status === 400) {
        // Treat 404/400 as invalid corporation number
        try {
          const errorData = await response.json();
          return {
            kind: "invalid",
            message: errorData.message || "Corporation number not found"
          };
        } catch {
          return {
            kind: "invalid",
            message: "Corporation number not found"
          };
        }
      }
      
      return {
        kind: "error",
        error: "server",
        message: `HTTP ${response.status}`
      };
    }
    
    const data = await response.json();
    
    // Check if the API response indicates validity
    if (data.valid === true) {
      return {
        kind: "valid",
        corporationNumber: corporationNumber
      };
    } else if (data.valid === false) {
      return {
        kind: "invalid",
        message: data.message || "Invalid corporation number"
      };
    }
    
    // Handle legacy response format
    if (data.corporationNumber) {
      return {
        kind: "valid",
        corporationNumber: corporationNumber
      };
    }
    
    return {
      kind: "invalid",
      message: data.message || "Corporation number validation failed"
    };
    
  } catch (error) {
    if (signal.aborted) {
      throw error; // Let the caller handle cancellation
    }
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw error;
      }
      
      if (error.message.includes("timeout") || error.name === "TimeoutError") {
        return {
          kind: "error",
          error: "timeout",
          message: "Request timed out"
        };
      }
      
      if (error.message.includes("Failed to fetch") || 
          error.message.includes("NetworkError") ||
          error.name === "TypeError") {
        return {
          kind: "error",
          error: "network",
          message: "Network connection failed"
        };
      }
    }
    
    return {
      kind: "error",
      error: "network",
      message: "An unexpected network error occurred"
    };
  }
};
