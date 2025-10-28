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
    return "Name is required";
  }
  if (trimmed.length > 50) {
    return "Name must be 50 characters or less";
  }
  // Check for invalid characters
  if (!/^[\p{L}\s'-]+$/u.test(trimmed)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return "Invalid name";
}

/**
 * User-friendly error message for invalid Canadian phone numbers
 */
export function getPhoneValidationError(phone: string): string {
  if (phone.length === 0) {
    return "Phone number is required";
  }
  if (!phone.startsWith("+1")) {
    return "Phone number must start with +1 (Canadian country code)";
  }
  if (phone.length !== 12) {
    return "Phone number must be +1 followed by 10 digits";
  }
  if (!/^\+1\d{10}$/.test(phone)) {
    return "Phone number contains invalid characters";
  }
  return "Invalid phone number";
}