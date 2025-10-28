/**
 * Corporation number field state machine with remote validation
 * 
 * Implements a sophisticated state machine for corporation number validation
 * with local plausibility checking, remote I/O, caching, and cancellation.
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import { 
  isPlausibleCorpNo, 
  whyNotPlausibleCorpNo, 
  toPlausibleCorpNo,
  type PlausibleCorpNo, 
  type CorpNoLocalIssue 
} from "../domain/corpNo";
import type { CorpNoFetcher, CorpNoValidationResult } from "../io/corpFetcher";
import type { CorpNoCache } from "../cache/inMemoryCorpNoCache";

// ============================================================================
// Types
// ============================================================================

export type CorpNoFieldTag = 
  | "empty" 
  | "active" 
  | "implausible" 
  | "checking" 
  | "valid" 
  | "invalid" 
  | "error";

export interface CorpNoFieldState {
  readonly tag: CorpNoFieldTag;
  readonly value: string;
  readonly lastUpdatedAt: number;
  readonly lastBlurAt: number | null;
  readonly lastCheckedAt: number | null;
  readonly localIssue: CorpNoLocalIssue | null;
  readonly remoteMessage: string | null;
  readonly currentValue: PlausibleCorpNo | null; // Only when checking/valid/invalid/error
}

export type CorpNoFieldEvent =
  | { type: "change"; value: string; timestamp: number }
  | { type: "blur"; timestamp: number }
  | { type: "focus"; timestamp: number }
  | { type: "evaluate"; timestamp: number }
  | { type: "remote:start"; currentValue: PlausibleCorpNo; timestamp: number }
  | { type: "remote:ok"; result: CorpNoValidationResult; timestamp: number }
  | { type: "remote:invalid"; result: CorpNoValidationResult; timestamp: number }
  | { type: "remote:error"; result: CorpNoValidationResult; timestamp: number };

// ============================================================================
// State Machine Reducer
// ============================================================================

function createInitialState(): CorpNoFieldState {
  return {
    tag: "empty",
    value: "",
    lastUpdatedAt: 0, // Start at 0 to indicate no user interaction yet
    lastBlurAt: null,
    lastCheckedAt: null,
    localIssue: null,
    remoteMessage: null,
    currentValue: null,
  };
}

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function corpNoFieldReducer(
  state: CorpNoFieldState,
  event: CorpNoFieldEvent
): CorpNoFieldState {
  switch (event.type) {
    case "change": {
      const { value, timestamp } = event;
      
      // Any change from remote states cancels and returns to active/empty
      if (state.tag === "checking" || state.tag === "valid" || state.tag === "invalid" || state.tag === "error") {
        // This will trigger abort in the effect
      }
      
      if (value.length === 0) {
        return {
          tag: "empty",
          value,
          lastUpdatedAt: timestamp,
          lastBlurAt: state.lastBlurAt,
          lastCheckedAt: state.lastCheckedAt,
          localIssue: null,
          remoteMessage: null,
          currentValue: null,
        };
      }
      
      return {
        tag: "active",
        value,
        lastUpdatedAt: timestamp,
        lastBlurAt: state.lastBlurAt,
        lastCheckedAt: state.lastCheckedAt,
        localIssue: null,
        remoteMessage: null,
        currentValue: null,
      };
    }
    
    case "blur": {
      return {
        ...state,
        lastBlurAt: event.timestamp,
      };
    }
    
    case "focus": {
      // Clear error states on focus
      if (state.tag === "invalid" || state.tag === "error" || state.tag === "implausible") {
        return {
          ...state,
          tag: state.value ? "active" : "empty",
          localIssue: null,
          remoteMessage: null,
        };
      }
      return state;
    }
    
    case "evaluate": {
      const { timestamp } = event;
      
      // Can only evaluate from active or implausible states
      if (state.tag !== "active" && state.tag !== "implausible") {
        return state;
      }
      
      const localIssue = whyNotPlausibleCorpNo(state.value);
      
      if (localIssue !== null) {
        return {
          ...state,
          tag: "implausible",
          localIssue,
          lastUpdatedAt: timestamp,
        };
      }
      
      // Value is plausible, transition to checking
      const currentValue = toPlausibleCorpNo(state.value);
      
      return {
        ...state,
        tag: "checking",
        localIssue: null,
        currentValue,
        lastUpdatedAt: timestamp,
      };
    }
    
    case "remote:start": {
      // Should only happen from checking state, but we'll be defensive
      if (state.tag !== "checking") {
        return state;
      }
      
      return {
        ...state,
        currentValue: event.currentValue,
        lastUpdatedAt: event.timestamp,
      };
    }
    
    case "remote:ok": {
      if (state.tag !== "checking") {
        return state;
      }
      
      const { result, timestamp } = event;
      
      if (result.kind === "valid") {
        return {
          ...state,
          tag: "valid",
          lastCheckedAt: timestamp,
          lastUpdatedAt: timestamp,
          remoteMessage: null,
        };
      }
      
      // This shouldn't happen in remote:ok, but handle gracefully
      return state;
    }
    
    case "remote:invalid": {
      if (state.tag !== "checking") {
        return state;
      }
      
      const { result, timestamp } = event;
      
      if (result.kind === "invalid") {
        return {
          ...state,
          tag: "invalid",
          lastCheckedAt: timestamp,
          lastUpdatedAt: timestamp,
          remoteMessage: result.message,
        };
      }
      
      return state;
    }
    
    case "remote:error": {
      if (state.tag !== "checking") {
        return state;
      }
      
      const { result, timestamp } = event;
      
      if (result.kind === "error") {
        return {
          ...state,
          tag: "error",
          lastCheckedAt: timestamp,
          lastUpdatedAt: timestamp,
          remoteMessage: result.message || `${result.error} error occurred`,
        };
      }
      
      return state;
    }
    
    default:
      return assertNever(event);
  }
}

// ============================================================================
// Hook
// ============================================================================

export interface CorpNoFieldHookOptions {
  fetcher: CorpNoFetcher;
  cache?: CorpNoCache;
  idleMs?: number;
  cacheTtlMs?: number;
}

export interface CorpNoFieldHook {
  state: CorpNoFieldState;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  validateNow: () => Promise<boolean>;
  reset: () => void;
  
  isTouched: boolean;
  isLoading: boolean;
  isValid: boolean;
  localIssue: CorpNoLocalIssue | null;
  lastCheckedAt: number | null;
}

interface RequestTracker {
  id: number;
  controller: AbortController;
  currentValue: PlausibleCorpNo;
}

let requestIdCounter = 0;

export function useCorpNoField({
  fetcher,
  cache,
  idleMs = 600,
  cacheTtlMs = 5 * 60 * 1000,
}: CorpNoFieldHookOptions): CorpNoFieldHook {
  const [state, dispatch] = useReducer(corpNoFieldReducer, undefined, createInitialState);
  
  const idleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const prevLastBlurAtRef = useRef<number | null>(null);
  const currentRequestRef = useRef<RequestTracker | null>(null);
  const validationAwaiterRef = useRef<{
    resolve: (isValid: boolean) => void;
    reject: (error: Error) => void;
  } | null>(null);
  
  // Clear idle timer when state changes
  useEffect(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = undefined;
    }
    
    // Set idle timer for active and implausible states
    if (state.tag === "active" || state.tag === "implausible") {
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
      
      if (state.lastBlurAt !== null && (state.tag === "active" || state.tag === "implausible")) {
        const evaluateTimeout = setTimeout(() => {
          dispatch({ type: "evaluate", timestamp: Date.now() });
        }, 0);
        
        return () => clearTimeout(evaluateTimeout);
      }
    }
  }, [state.lastBlurAt, state.tag]);
  
  // Handle remote I/O when transitioning to checking
  useEffect(() => {
    if (state.tag === "checking" && state.currentValue) {
      const currentValue = state.currentValue;
      
      // Check cache first
      if (cache) {
        const cached = cache.get(currentValue);
        if (cached) {
          const timestamp = Date.now();
          
          if (cached.kind === "valid") {
            dispatch({ type: "remote:ok", result: cached, timestamp });
            if (validationAwaiterRef.current) {
              validationAwaiterRef.current.resolve(true);
              validationAwaiterRef.current = null;
            }
          } else if (cached.kind === "invalid") {
            dispatch({ type: "remote:invalid", result: cached, timestamp });
            if (validationAwaiterRef.current) {
              validationAwaiterRef.current.resolve(false);
              validationAwaiterRef.current = null;
            }
          } else {
            dispatch({ type: "remote:error", result: cached, timestamp });
            if (validationAwaiterRef.current) {
              validationAwaiterRef.current.resolve(false);
              validationAwaiterRef.current = null;
            }
          }
          return;
        }
      }
      
      // Abort any existing request
      if (currentRequestRef.current) {
        currentRequestRef.current.controller.abort();
      }
      
      // Start new request
      const requestId = ++requestIdCounter;
      const controller = new AbortController();
      
      currentRequestRef.current = {
        id: requestId,
        controller,
        currentValue,
      };
      
      dispatch({
        type: "remote:start",
        currentValue,
        timestamp: Date.now(),
      });
      
      const performRequest = async () => {
        try {
          if (typeof fetcher !== 'function') {
            const timestamp = Date.now();
            const fallbackError: CorpNoValidationResult = {
              kind: "error",
              error: "network",
              message: "fetcher is not a function",
            };
            dispatch({ type: "remote:error", result: fallbackError, timestamp });
            if (validationAwaiterRef.current) {
              validationAwaiterRef.current.resolve(false);
              validationAwaiterRef.current = null;
            }
            return;
          }

          const result = await fetcher(currentValue, controller.signal);
          
          // Check if this request is still current
          if (currentRequestRef.current?.id === requestId && !controller.signal.aborted) {
            const timestamp = Date.now();
            
            // Update cache
            if (cache && (result.kind === "valid" || result.kind === "invalid")) {
              cache.set(currentValue, result, cacheTtlMs);
            }
            
            // Dispatch appropriate event
            if (result.kind === "valid") {
              dispatch({ type: "remote:ok", result, timestamp });
              if (validationAwaiterRef.current) {
                validationAwaiterRef.current.resolve(true);
                validationAwaiterRef.current = null;
              }
            } else if (result.kind === "invalid") {
              dispatch({ type: "remote:invalid", result, timestamp });
              if (validationAwaiterRef.current) {
                validationAwaiterRef.current.resolve(false);
                validationAwaiterRef.current = null;
              }
            } else {
              dispatch({ type: "remote:error", result, timestamp });
              if (validationAwaiterRef.current) {
                validationAwaiterRef.current.resolve(false);
                validationAwaiterRef.current = null;
              }
            }
          }
        } catch (error) {
          if (!controller.signal.aborted && currentRequestRef.current?.id === requestId) {
            const timestamp = Date.now();
            const errorResult: CorpNoValidationResult = {
              kind: "error",
              error: "network",
              message: error instanceof Error ? error.message : "Network error",
            };
            
            dispatch({ type: "remote:error", result: errorResult, timestamp });
            
            if (validationAwaiterRef.current) {
              validationAwaiterRef.current.resolve(false);
              validationAwaiterRef.current = null;
            }
          }
        }
      };
      
      performRequest();
      
      return () => {
        if (currentRequestRef.current?.id === requestId) {
          controller.abort();
          currentRequestRef.current = null;
        }
      };
    }
  }, [state.tag, state.currentValue, fetcher, cache, cacheTtlMs]);
  
  // Abort request on value change
  useEffect(() => {
    if (state.tag === "active" || state.tag === "empty") {
      if (currentRequestRef.current) {
        currentRequestRef.current.controller.abort();
        currentRequestRef.current = null;
      }
      
      if (validationAwaiterRef.current) {
        validationAwaiterRef.current.resolve(false);
        validationAwaiterRef.current = null;
      }
    }
  }, [state.tag, state.value]);
  
  const onChange = useCallback((value: string) => {
    dispatch({ type: "change", value, timestamp: Date.now() });
  }, []);
  
  const onBlur = useCallback(() => {
    dispatch({ type: "blur", timestamp: Date.now() });
  }, []);
  
  const onFocus = useCallback(() => {
    dispatch({ type: "focus", timestamp: Date.now() });
  }, []);
  
  const validateNow = useCallback((): Promise<boolean> => {
    dispatch({ type: "evaluate", timestamp: Date.now() });
    
    return new Promise((resolve, reject) => {
      // If already in a terminal state, resolve immediately
      if (state.tag === "valid") {
        resolve(true);
        return;
      }
      if (state.tag === "invalid" || state.tag === "error" || state.tag === "implausible") {
        resolve(false);
        return;
      }
      
      // Store awaiter for async resolution
      validationAwaiterRef.current = { resolve, reject };
      
      // Set timeout to avoid hanging
      setTimeout(() => {
        if (validationAwaiterRef.current?.resolve === resolve) {
          validationAwaiterRef.current = null;
          resolve(false);
        }
      }, 15000); // 15 second timeout
    });
  }, [state.tag]);
  
  const reset = useCallback(() => {
    if (currentRequestRef.current) {
      currentRequestRef.current.controller.abort();
      currentRequestRef.current = null;
    }
    
    if (validationAwaiterRef.current) {
      validationAwaiterRef.current.resolve(false);
      validationAwaiterRef.current = null;
    }
    
    const initialState = createInitialState();
    // We can't directly set state, but we can dispatch a change to empty
    dispatch({ type: "change", value: "", timestamp: Date.now() });
  }, []);
  
  const isTouched = state.lastBlurAt !== null || state.value.length > 0;
  const isLoading = state.tag === "checking";
  const isValid = state.tag === "valid";
  const localIssue = state.localIssue;
  const lastCheckedAt = state.lastCheckedAt;
  
  return {
    state,
    value: state.value,
    onChange,
    onBlur,
    onFocus,
    validateNow,
    reset,
    isTouched,
    isLoading,
    isValid,
    localIssue,
    lastCheckedAt,
  };
}
