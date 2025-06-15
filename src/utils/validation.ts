/**
 * Validates an email address
 * @param email - The email to validate
 * @returns True if the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password strength
 * @param password - The password to validate
 * @returns True if the password meets minimum requirements
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validates a phone number
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Validates a URL
 * @param url - The URL to validate
 * @returns True if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validates that a text field is not empty
 * @param text - The text to validate
 * @returns True if the text is not empty
 */
export function isNotEmpty(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Validates that a number is positive
 * @param num - The number to validate
 * @returns True if the number is positive
 */
export function isPositiveNumber(num: number): boolean {
  return !isNaN(num) && num > 0;
}