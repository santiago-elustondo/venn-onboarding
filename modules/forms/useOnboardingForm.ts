/**
 * Onboarding form composition using individual field state machines
 * 
 * Orchestrates all form fields and provides unified validation and submission.
 * Uses dependency injection for I/O adapters and maintains clean separation
 * between field logic and form-level concerns.
 */

import { useCallback, useRef, useState } from "react";
import { useNameField } from "../fields/useNameField";
import { usePhoneField } from "../fields/usePhoneField";
import { useCorpNoField } from "../fields/useCorpNoField";
import { createDefaultCorpNoCache } from "../cache/inMemoryCorpNoCache";
import { toPlausibleCorpNo } from "../domain/corpNo";
import { getNameValidationError, getPhoneValidationError } from "../domain/simple";
import type { CorpNoFetcher } from "../io/corpFetcher";
import type { ProfileDetailsSubmitter, ProfileDetailsPayload } from "../io/postProfileDetails";
import type { CorpNoCache } from "../cache/inMemoryCorpNoCache";

// ============================================================================
// Types
// ============================================================================

export interface UseOnboardingFormDeps {
  corpFetcher: CorpNoFetcher;
  postProfileDetails: ProfileDetailsSubmitter;
  cache?: CorpNoCache;
  idleMs?: number;
  cacheTtlMs?: number;
}

export interface UseOnboardingFormReturn {
  // Field hooks
  firstName: ReturnType<typeof useNameField>;
  lastName: ReturnType<typeof useNameField>;
  phone: ReturnType<typeof usePhoneField>;
  corporationNumber: ReturnType<typeof useCorpNoField>;
  
  // Form-level state
  canSubmit: boolean;
  isSubmitting: boolean;
  formError: string | null;
  
  // Form-level actions
  validateAll: () => Promise<boolean>;
  submit: () => Promise<boolean>;
  reset: () => void;
  
  // Convenience getters
  getFieldErrors: () => {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    corporationNumber: string | null;
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOnboardingForm({
  corpFetcher,
  postProfileDetails,
  cache,
  idleMs = 500,
  cacheTtlMs = 5 * 60 * 1000,
}: UseOnboardingFormDeps): UseOnboardingFormReturn {
  
  // Create default cache if none provided
  const defaultCache = useRef<CorpNoCache | undefined>(undefined);
  if (!defaultCache.current) {
    defaultCache.current = createDefaultCorpNoCache(cacheTtlMs);
  }
  
  const actualCache = cache || defaultCache.current;
  
  // Individual field hooks
  const firstName = useNameField({ idleMs });
  const lastName = useNameField({ idleMs });
  const phone = usePhoneField({ idleMs });
  const corporationNumber = useCorpNoField({
    fetcher: corpFetcher,
    cache: actualCache,
    idleMs: idleMs + 100, // Slightly longer idle for corp number
    cacheTtlMs,
  });
  
  // Form-level state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Derive canSubmit from field states
  const canSubmit = 
    firstName.isValid && 
    lastName.isValid && 
    phone.isValid && 
    corporationNumber.isValid && 
    !isSubmitting;
  
  // Get current field error messages
  const getFieldErrors = useCallback(() => {
    const errors = {
      firstName: firstName.isInvalid 
        ? getNameValidationError(firstName.value)
        : null,
      
      lastName: lastName.isInvalid 
        ? getNameValidationError(lastName.value) 
        : null,
      
      phone: phone.isInvalid 
        ? getPhoneValidationError(phone.value) 
        : null,
      
      corporationNumber: (() => {
        if (!corporationNumber.isTouched) return null;
        
        if (corporationNumber.localIssue) {
          // Import here to avoid circular dependencies
          const { formatCorpNoLocalIssue } = require("../domain/corpNo");
          return formatCorpNoLocalIssue(corporationNumber.localIssue);
        }
        
        if (corporationNumber.state.tag === "invalid" && corporationNumber.state.remoteMessage) {
          return corporationNumber.state.remoteMessage;
        }
        
        if (corporationNumber.state.tag === "error" && corporationNumber.state.remoteMessage) {
          return corporationNumber.state.remoteMessage;
        }
        
        if (corporationNumber.state.tag === "implausible" && corporationNumber.localIssue) {
          const { formatCorpNoLocalIssue } = require("../domain/corpNo");
          return formatCorpNoLocalIssue(corporationNumber.localIssue);
        }
        
        return null;
      })(),
    };
    
    return errors;
  }, [
    firstName.isInvalid, firstName.value,
    lastName.isInvalid, lastName.value,
    phone.isInvalid, phone.value,
    corporationNumber.isTouched, corporationNumber.state, corporationNumber.localIssue,
  ]);
  
  // Validate all fields and wait for async ones to complete
  const validateAll = useCallback(async (): Promise<boolean> => {
    // Clear any previous form errors
    setFormError(null);
    
    // Trigger evaluation on all fields
    firstName.evaluate();
    lastName.evaluate();
    phone.evaluate();
    
    // Wait a microtask for synchronous evaluations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // For corporation number, use validateNow which returns a promise
    const corpValid = await corporationNumber.validateNow();
    
    // Check final validity after all evaluations complete
    const simpleFieldsValid = firstName.isValid && lastName.isValid && phone.isValid;
    
    return simpleFieldsValid && corpValid;
  }, [firstName, lastName, phone, corporationNumber]);
  
  // Submit the form
  const submit = useCallback(async (): Promise<boolean> => {
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      // First, validate all fields
      const isValid = await validateAll();
      
      if (!isValid) {
        return false;
      }
      
      // Ensure we have all required data
      if (!corporationNumber.isValid || !corporationNumber.state.currentValue) {
        setFormError("Corporation number validation is incomplete");
        return false;
      }
      
      // Prepare payload
      const payload: ProfileDetailsPayload = {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        phone: phone.value,
        corporationNumber: corporationNumber.state.currentValue,
      };
      
      // Create abort controller for the request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      // Submit
      const result = await postProfileDetails(payload, controller.signal);
      
      if (result.ok) {
        return true;
      } 
      
      // At this point we know result.ok is false
      setFormError((result as { ok: false; message: string }).message);
      return false;
      
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was cancelled, don't show error
        return false;
      }
      
      setFormError("An unexpected error occurred. Please try again.");
      return false;
      
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  }, [validateAll, firstName, lastName, phone, corporationNumber, postProfileDetails]);
  
  // Reset all form state
  const reset = useCallback(() => {
    // Abort any ongoing submission
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset all fields
    firstName.onChange("");
    lastName.onChange("");
    phone.onChange("");
    corporationNumber.reset();
    
    // Reset form state
    setIsSubmitting(false);
    setFormError(null);
  }, [firstName, lastName, phone, corporationNumber]);
  
  return {
    firstName,
    lastName,
    phone,
    corporationNumber,
    canSubmit,
    isSubmitting,
    formError,
    validateAll,
    submit,
    reset,
    getFieldErrors,
  };
}