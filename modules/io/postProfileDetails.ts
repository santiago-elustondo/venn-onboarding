/**
 * Profile details submission I/O adapter
 * 
 * Handles form submission with proper error handling and typed responses.
 */

import type { PlausibleCorpNo } from "../domain/corpNo";

export interface ProfileDetailsPayload {
  firstName: string;
  lastName: string;
  corporationNumber: PlausibleCorpNo;
  phone: string;
}

export type ProfileDetailsResult =
  | { ok: true }
  | { ok: false; message: string };

export type ProfileDetailsSubmitter = (
  payload: ProfileDetailsPayload,
  signal: AbortSignal
) => Promise<ProfileDetailsResult>;

/**
 * Default implementation of profile details submitter
 * Uses the existing API endpoint with enhanced error handling
 */
export const postProfileDetails: ProfileDetailsSubmitter = async (payload, signal) => {
  const API_BASE_URL = "https://fe-hometask-api.qa.vault.tryvault.com";
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Combine external signal with timeout signal
    const combinedSignal = AbortSignal.any ? 
      AbortSignal.any([signal, controller.signal]) : 
      signal;
    
    const response = await fetch(
      `${API_BASE_URL}/profile-details`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          phone: payload.phone,
          corporationNumber: payload.corporationNumber,
        }),
        signal: combinedSignal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (combinedSignal.aborted) {
      throw new Error("Request was cancelled");
    }
    
    if (response.ok) {
      return { ok: true };
    }
    
    // Handle error responses
    let errorMessage = "Submission failed";
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If we can't parse the error response, use a generic message based on status
      if (response.status >= 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (response.status === 400) {
        errorMessage = "Invalid form data. Please check your inputs.";
      } else if (response.status === 409) {
        errorMessage = "This information has already been submitted.";
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
    }
    
    return {
      ok: false,
      message: errorMessage,
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
          ok: false,
          message: "Request timed out. Please try again.",
        };
      }
      
      if (error.message.includes("Failed to fetch") || 
          error.message.includes("NetworkError") ||
          error.name === "TypeError") {
        return {
          ok: false,
          message: "Network connection failed. Please check your internet connection.",
        };
      }
    }
    
    return {
      ok: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};