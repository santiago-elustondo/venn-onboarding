/**
 * Name field hook using the simple field state machine
 */

import { isValidName } from "../domain/simple";
import { useSimpleField, type SimpleFieldHook } from "./useSimpleField";

export interface NameFieldHookOptions {
  idleMs?: number;
}

export function useNameField(options: NameFieldHookOptions = {}): SimpleFieldHook {
  return useSimpleField({
    validator: isValidName,
    idleMs: options.idleMs,
  });
}