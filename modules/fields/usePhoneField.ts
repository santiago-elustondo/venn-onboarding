/**
 * Phone field hook using the simple field state machine
 */

import { isValidPhoneCA } from "../domain/simple";
import { useSimpleField, type SimpleFieldHook } from "./useSimpleField";

export interface PhoneFieldHookOptions {
  idleMs?: number;
}

export function usePhoneField(options: PhoneFieldHookOptions = {}): SimpleFieldHook {
  return useSimpleField({
    validator: isValidPhoneCA,
    idleMs: options.idleMs,
  });
}