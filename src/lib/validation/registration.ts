// Password strength calculation
export function getPasswordStrength(password: string) {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return { score: 0, feedback: ['Password is required'], isStrong: false };
  }

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Uppercase letter check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  // Length bonus
  if (password.length >= 12) {
    score += 1;
  }

  const isStrong = score >= 5;

  return {
    score,
    feedback,
    isStrong
  };
}

// Registration data type
export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username?: string;
  phoneNumber?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

// Validation result type
export interface ValidationResult {
  success: boolean;
  error?: string;
}

// Individual field validation functions
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { success: false, error: 'Email is required' };
  }
  if (email.length > 254) {
    return { success: false, error: 'Email is too long' };
  }
  if (!validationPatterns.email.test(email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }
  if (email.includes('+')) {
    return { success: false, error: 'Email addresses with + symbols are not allowed' };
  }
  return { success: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { success: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { success: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { success: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { success: false, error: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { success: false, error: 'Password must contain at least one special character' };
  }
  return { success: true };
}

export function validateName(name: string, fieldName: string): ValidationResult {
  if (!name) {
    return { success: false, error: `${fieldName} is required` };
  }
  if (name.length < 2) {
    return { success: false, error: `${fieldName} must be at least 2 characters` };
  }
  if (name.length > 50) {
    return { success: false, error: `${fieldName} is too long` };
  }
  if (!validationPatterns.name.test(name)) {
    return { success: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  return { success: true };
}

export function validateUsername(username?: string): ValidationResult {
  if (!username) return { success: true };
  if (username.length < 3 || username.length > 30) {
    return { success: false, error: 'Username must be between 3 and 30 characters' };
  }
  if (!validationPatterns.username.test(username)) {
    return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  return { success: true };
}

export function validatePhoneNumber(phone?: string): ValidationResult {
  if (!phone) return { success: true };
  if (!validationPatterns.phone.test(phone)) {
    return { success: false, error: 'Phone number must be in format (555) 123-4567' };
  }
  return { success: true };
}

export function validateAge(age?: number): ValidationResult {
  if (age === undefined) return { success: true };
  if (age < 13 || age > 120) {
    return { success: false, error: 'Age must be between 13 and 120' };
  }
  return { success: true };
}

// Type inference
export type PasswordStrength = ReturnType<typeof getPasswordStrength>;

// Complete registration validation
export function validateRegistration(data: RegistrationData): ValidationResult {
  // Email validation
  const emailResult = validateEmail(data.email);
  if (!emailResult.success) return emailResult;

  // Password validation
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.success) return passwordResult;

  // Confirm password validation
  if (!data.confirmPassword) {
    return { success: false, error: 'Please confirm your password' };
  }
  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  // First name validation
  const firstNameResult = validateName(data.firstName, 'First name');
  if (!firstNameResult.success) return firstNameResult;

  // Last name validation
  const lastNameResult = validateName(data.lastName, 'Last name');
  if (!lastNameResult.success) return lastNameResult;

  // Optional field validations
  const usernameResult = validateUsername(data.username);
  if (!usernameResult.success) return usernameResult;

  const phoneResult = validatePhoneNumber(data.phoneNumber);
  if (!phoneResult.success) return phoneResult;

  const ageResult = validateAge(data.age);
  if (!ageResult.success) return ageResult;

  // Terms and privacy validation
  if (!data.agreeToTerms) {
    return { success: false, error: 'You must agree to the Terms of Service' };
  }
  if (!data.agreeToPrivacy) {
    return { success: false, error: 'You must agree to the Privacy Policy' };
  }

  return { success: true };
}

// Validation helper function for individual fields
export function validateField(fieldName: keyof RegistrationData, value: any): ValidationResult {
  switch (fieldName) {
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'firstName':
      return validateName(value, 'First name');
    case 'lastName':
      return validateName(value, 'Last name');
    case 'username':
      return validateUsername(value);
    case 'phoneNumber':
      return validatePhoneNumber(value);
    case 'age':
      return validateAge(value);
    case 'confirmPassword':
      if (!value) return { success: false, error: 'Please confirm your password' };
      return { success: true };
    case 'agreeToTerms':
      return value ? { success: true } : { success: false, error: 'You must agree to the Terms of Service' };
    case 'agreeToPrivacy':
      return value ? { success: true } : { success: false, error: 'You must agree to the Privacy Policy' };
    default:
      return { success: true };
  }
}

// Format phone number as user types
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length >= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else if (digits.length >= 3) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return digits;
  }
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\(\d{3}\) \d{3}-\d{4}$/,
  username: /^[a-zA-Z0-9_-]+$/,
  name: /^[a-zA-Z\s'-]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
};

// Error messages
export const errorMessages = {
  required: 'This field is required',
  email: {
    invalid: 'Please enter a valid email address',
    tooLong: 'Email address is too long',
    noPlus: 'Email addresses with + symbols are not allowed'
  },
  password: {
    tooShort: 'Password must be at least 8 characters long',
    noUppercase: 'Password must contain at least one uppercase letter',
    noLowercase: 'Password must contain at least one lowercase letter',
    noNumber: 'Password must contain at least one number',
    noSpecial: 'Password must contain at least one special character',
    noMatch: 'Passwords do not match'
  },
  name: {
    tooShort: 'Name must be at least 2 characters',
    tooLong: 'Name is too long',
    invalidChars: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  },
  username: {
    tooShort: 'Username must be at least 3 characters',
    tooLong: 'Username must be no more than 30 characters',
    invalidChars: 'Username can only contain letters, numbers, underscores, and hyphens'
  },
  phone: {
    invalid: 'Phone number must be in format (555) 123-4567'
  },
  age: {
    tooYoung: 'You must be at least 13 years old',
    tooOld: 'Please enter a valid age',
    invalid: 'Please enter a valid age'
  },
  terms: 'You must agree to the Terms of Service',
  privacy: 'You must agree to the Privacy Policy'
};
