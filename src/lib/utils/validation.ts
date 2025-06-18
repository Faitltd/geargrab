// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

// Phone number validation
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phoneNumber);
}

// Alias for consistency with other validation functions
export function isValidPhone(phone: string): boolean {
  return isValidPhoneNumber(phone);
}

// ZIP code validation
export function isValidZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// Credit card validation (Luhn algorithm)
export function isValidCreditCard(cardNumber: string): boolean {
  // Remove spaces and dashes
  const sanitized = cardNumber.replace(/[\s-]/g, '');
  
  // Check if it contains only digits
  if (!/^\d+$/.test(sanitized)) return false;
  
  // Check length (most cards are 13-19 digits)
  if (sanitized.length < 13 || sanitized.length > 19) return false;
  
  // Luhn algorithm
  let sum = 0;
  let double = false;
  
  // Loop through values starting from the rightmost digit
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i));
    
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    double = !double;
  }
  
  return sum % 10 === 0;
}

// Date validation (check if date is in the future)
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// Required field validation
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

// Text not empty validation (alias for consistency)
export function isNotEmpty(text: string): boolean {
  return text.trim().length > 0;
}

// Positive number validation
export function isPositiveNumber(num: number): boolean {
  return !isNaN(num) && num > 0;
}

// Min/max length validation
export function isWithinLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

// Min/max value validation
export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// File type validation
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// File size validation
export function isValidFileSize(file: File, maxSizeInBytes: number): boolean {
  return file.size <= maxSizeInBytes;
}

// Form validation helper
export function validateForm(
  formData: Record<string, any>,
  validationRules: Record<string, (value: any) => boolean>,
  customMessages: Record<string, string> = {}
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  for (const field in validationRules) {
    if (Object.prototype.hasOwnProperty.call(validationRules, field)) {
      const isValidField = validationRules[field](formData[field]);
      
      if (!isValidField) {
        errors[field] = customMessages[field] || `${field} is invalid`;
        isValid = false;
      }
    }
  }
  
  return { isValid, errors };
}
