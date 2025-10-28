/**
 * Domain module for simple field validation
 * 
 * Provides synchronous validators for name and phone fields
 * with clear, deterministic validation rules.
 */

/**
 * Validates a name field (first name or last name)
 * 
 * Rules:
 * - Must not be empty (after trimming)
 * - Must be at least 3 characters long
 * - Must be 50 characters or less
 * - Only allows Unicode letters, spaces, hyphens, and apostrophes
 */
export function isValidName(s: string): boolean {
  const trimmed = s.trim();
  if (trimmed.length === 0 || trimmed.length > 50) {
    return false;
  }
  // Allow Unicode letters, spaces, hyphens, and apostrophes
  // \p{L} matches any Unicode letter category
  return /^[\p{L}\s'-]+$/u.test(trimmed);
}

/**
 * Validates a Canadian phone number
 * 
 * Rules:
 * - Must start with +1 (country code)
 * - Followed by exactly 10 digits
 * - Total format: +1XXXXXXXXXX (12 characters)
 */
export function isValidPhoneCA(s: string): boolean {
  return /^\+1\d{10}$/.test(s);
}

/**
 * User-friendly error message for invalid names
 */
export function getNameValidationError(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "Required";
  }
  if (trimmed.length > 50) {
    return "Too long";
  }
  // Check for invalid characters using the same validation as isValidName
  if (!/^[\p{L}\s'-]+$/u.test(trimmed)) {
    return "Letters only";
  }
  return "Invalid";
}

/**
 * User-friendly error message for invalid Canadian phone numbers
 */
export function getPhoneValidationError(phone: string): string {
  if (phone.length === 0) {
    return "Required";
  }
  if (!phone.startsWith("+1")) {
    return "Need +1";
  }
  if (phone.length !== 12) {
    return "Invalid format";
  }
  if (!/^\+1\d{10}$/.test(phone)) {
    return "Invalid chars";
  }
  return "Invalid";
}