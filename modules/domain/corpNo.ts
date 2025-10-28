/**
 * Domain module for Corporation Number validation and types
 * 
 * Provides type-safe validation for Canadian corporation numbers with
 * explicit issue diagnostics and plausibility checking.
 */

export type Digit = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9";

/**
 * A branded type for strings that have been verified to be plausible corporation numbers
 * (exactly 9 digits). This ensures type safety without complex template literals.
 */
export type PlausibleCorpNo = string & { readonly __brand: "PlausibleCorpNo" };

export type CorpNoLocalIssue = 
  | "empty" 
  | "contains_non_digit" 
  | "too_short" 
  | "too_long";

/**
 * Determines why a string is not a plausible corporation number
 * Returns null if the string is actually plausible
 */
export function whyNotPlausibleCorpNo(s: string): CorpNoLocalIssue | null {
  if (s.length === 0) {
    return "empty";
  }
  
  if (!/^\d+$/.test(s)) {
    return "contains_non_digit";
  }
  
  if (s.length < 9) {
    return "too_short";
  }
  
  if (s.length > 9) {
    return "too_long";
  }
  
  return null;
}

/**
 * Type guard to check if a string is a plausible corporation number
 * Only returns true for exactly 9 digits - does not verify remote validity
 */
export function isPlausibleCorpNo(s: string): s is PlausibleCorpNo {
  return whyNotPlausibleCorpNo(s) === null;
}

/**
 * Safely converts a string to PlausibleCorpNo after validation
 * Throws if the string is not plausible
 */
export function toPlausibleCorpNo(s: string): PlausibleCorpNo {
  const issue = whyNotPlausibleCorpNo(s);
  if (issue !== null) {
    throw new Error(`Cannot convert to PlausibleCorpNo: ${formatCorpNoLocalIssue(issue)}`);
  }
  return s as PlausibleCorpNo;
}

/**
 * User-friendly error messages for local corporation number issues
 */
export function formatCorpNoLocalIssue(issue: CorpNoLocalIssue): string {
  switch (issue) {
    case "empty":
      return "Required";
    case "contains_non_digit":
      return "Only digits";
    case "too_short":
      return "9 digits";
    case "too_long":
      return "9 digits";
  }
}