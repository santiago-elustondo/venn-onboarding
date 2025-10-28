/**
 * Phone field hook using the simple field state machine
 *
 * Provides a cohesive API with other field hooks while keeping
 * phone-specific conveniences like E.164 formatting and error strings.
 */

import { useCallback, useMemo, useState } from "react";
import { parsePhoneNumber } from "react-phone-number-input";
import { isValidPhoneCA, getPhoneValidationError } from "../domain/simple";
import { useSimpleField } from "./useSimpleField";

export interface PhoneFieldHookOptions {
  idleMs?: number;
}

export interface UsePhoneFieldReturn {
  value: string;
  onChange: (value: string | undefined) => void;
  onBlur: () => void;
  onFocus: () => void;
  isValid: boolean;
  isTouched: boolean;
  error?: string | null;
  e164: string | null;
  reset: () => void;
  touch: () => void;
}

export function usePhoneField(options: PhoneFieldHookOptions = {}): UsePhoneFieldReturn {
  const { idleMs = 500 } = options;

  // Reuse the simple local-validation state machine for consistency
  const simple = useSimpleField({ validator: isValidPhoneCA, idleMs });

  // Track touch and error visibility explicitly to match UX and tests
  const [isTouched, setIsTouched] = useState(false);
  const [hasError, setHasError] = useState(false);

  const onChange = useCallback((value?: string) => {
    simple.onChange(value ?? "");
    if (hasError) setHasError(false);
  }, [simple, hasError]);

  const onBlur = useCallback(() => {
    setIsTouched(true);
    // Evaluate and show error on blur if invalid
    const validNow = isValidPhoneCA(simple.value);
    setHasError(!validNow);
    simple.onBlur();
  }, [simple]);

  const onFocus = useCallback(() => {
    setHasError(false);
    simple.onFocus();
  }, [simple]);

  const touch = useCallback(() => {
    setIsTouched(true);
  }, []);

  const reset = useCallback(() => {
    simple.onChange("");
    setIsTouched(false);
    setHasError(false);
  }, [simple]);

  // Determine current validity immediately (don't rely on SM tag)
  const currentIsValid = useMemo(() => isValidPhoneCA(simple.value), [simple.value]);

  const error = useMemo(() => {
    if (!hasError) return null;
    return simple.value ? 'Invalid' : 'Required';
  }, [hasError, simple.value]);

  const e164 = useMemo(() => {
    if (!currentIsValid || !simple.value) return null;
    try {
      const parsed = parsePhoneNumber(simple.value);
      return parsed?.format('E.164') ?? null;
    } catch {
      return null;
    }
  }, [currentIsValid, simple.value]);

  return {
    value: simple.value,
    onChange,
    onBlur,
    onFocus,
    isValid: currentIsValid,
    isTouched,
    error,
    e164,
    reset,
    touch,
  };
}
