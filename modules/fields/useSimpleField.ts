/**
 * Simple field state machine for text inputs with blur/idle-driven validation
 * 
 * Implements a deterministic state machine for fields like name and phone
 * that have only local validation (no remote I/O).
 */

import { useCallback, useEffect, useReducer, useRef } from "react";

// ============================================================================
// Types
// ============================================================================

export type SimpleFieldTag = "empty" | "active" | "invalid" | "valid";

export interface SimpleFieldState {
  readonly tag: SimpleFieldTag;
  readonly value: string;
  readonly lastUpdatedAt: number;
  readonly lastBlurAt: number | null;
  readonly issue: "invalid" | null;
}

export type SimpleFieldEvent =
  | { type: "change"; value: string; timestamp: number }
  | { type: "blur"; timestamp: number }
  | { type: "focus"; timestamp: number }
  | { type: "evaluate"; timestamp: number };

// ============================================================================
// State Machine Reducer
// ============================================================================

function createInitialState(): SimpleFieldState {
  return {
    tag: "empty",
    value: "",
    lastUpdatedAt: 0, // Start at 0 to indicate no user interaction yet
    lastBlurAt: null,
    issue: null,
  };
}

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function simpleFieldReducer(
  state: SimpleFieldState,
  event: SimpleFieldEvent,
  validator: (value: string) => boolean
): SimpleFieldState {
  switch (event.type) {
    case "change": {
      const { value, timestamp } = event;
      
      if (value.length === 0) {
        return {
          tag: "empty",
          value,
          lastUpdatedAt: timestamp,
          lastBlurAt: state.lastBlurAt,
          issue: null,
        };
      }
      
      return {
        tag: "active",
        value,
        lastUpdatedAt: timestamp,
        lastBlurAt: state.lastBlurAt,
        issue: null,
      };
    }
    
    case "blur": {
      return {
        ...state,
        lastBlurAt: event.timestamp,
      };
    }
    
    case "focus": {
      // Clear error state on focus if we have one
      if (state.tag === "invalid") {
        return {
          ...state,
          tag: state.value ? "active" : "empty",
          issue: null,
        };
      }
      return state;
    }
    
    case "evaluate": {
      const { timestamp } = event;
      
      const isValid = validator(state.value);
      
      return {
        ...state,
        tag: isValid ? "valid" : "invalid",
        issue: isValid ? null : "invalid",
        lastUpdatedAt: timestamp,
      };
    }
    
    default:
      return assertNever(event);
  }
}

// ============================================================================
// Hook
// ============================================================================

export interface SimpleFieldHookOptions {
  validator: (value: string) => boolean;
  idleMs?: number;
}

export interface SimpleFieldHook {
  state: SimpleFieldState;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  evaluate: () => void;
  isTouched: boolean;
  isValid: boolean;
  isInvalid: boolean;  // Add explicit invalid state
  localIssue: "invalid" | null;
}

export function useSimpleField({ 
  validator, 
  idleMs = 500 
}: SimpleFieldHookOptions): SimpleFieldHook {
  const [state, dispatch] = useReducer(
    (state: SimpleFieldState, event: SimpleFieldEvent) => 
      simpleFieldReducer(state, event, validator),
    undefined,
    createInitialState
  );
  
  const idleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const prevLastBlurAtRef = useRef<number | null>(null);
  
  // Clear idle timer when state changes
  useEffect(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = undefined;
    }
    
    // Set idle timer for active states
    if (state.tag === "active") {
      idleTimeoutRef.current = setTimeout(() => {
        dispatch({ type: "evaluate", timestamp: Date.now() });
      }, idleMs);
    }
    
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [state.tag, state.lastUpdatedAt, idleMs]);
  
  // Detect blur edge and trigger evaluation
  useEffect(() => {
    if (state.lastBlurAt !== prevLastBlurAtRef.current) {
      prevLastBlurAtRef.current = state.lastBlurAt;
      
      if (state.lastBlurAt !== null && (state.tag === "active" || state.tag === "empty")) {
        // Trigger evaluation on blur edge
        const evaluateTimeout = setTimeout(() => {
          dispatch({ type: "evaluate", timestamp: Date.now() });
        }, 0);
        
        return () => clearTimeout(evaluateTimeout);
      }
    }
  }, [state.lastBlurAt, state.tag]);
  
  const onChange = useCallback((value: string) => {
    dispatch({ type: "change", value, timestamp: Date.now() });
  }, []);
  
  const onBlur = useCallback(() => {
    dispatch({ type: "blur", timestamp: Date.now() });
  }, []);
  
  const onFocus = useCallback(() => {
    dispatch({ type: "focus", timestamp: Date.now() });
  }, []);
  
  const evaluate = useCallback(() => {
    dispatch({ type: "evaluate", timestamp: Date.now() });
  }, []);
  
  const isTouched = state.lastBlurAt !== null || state.value.length > 0;
  const isValid = state.tag === "valid";
  const isInvalid = state.tag === "invalid";  // New: explicit invalid state
  const localIssue = state.issue;
  
  return {
    state,
    value: state.value,
    onChange,
    onBlur,
    onFocus,
    evaluate,
    isTouched,
    isValid,
    isInvalid,  // Add the explicit invalid state
    localIssue,
  };
}