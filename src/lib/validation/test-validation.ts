import { registrationSchema, getPasswordStrength, type RegistrationFormData } from './registration';
import { commonSchemas, validationUtils, PATTERNS } from './common';
import { z } from 'zod';

/**
 * Comprehensive Validation Test Suite
 * 
 * This file contains test cases and examples for all validation schemas
 * and utilities. Use this to verify validation behavior and as examples.
 */

// Test data sets
export const testData = {
  // Valid registration data
  validRegistration: {
    email: 'john.doe@geargrab.co',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe123',
    phoneNumber: '(555) 123-4567',
    age: 25,
    gender: 'male' as const,
    bio: 'Outdoor enthusiast and gear collector.',
    location: {
      city: 'San Francisco',
      state: 'California',
      country: 'United States',
      zipCode: '94102'
    },
    preferences: {
      newsletter: true,
      marketing: false,
      notifications: true,
      theme: 'auto' as const
    },
    agreeToTerms: true,
    agreeToPrivacy: true,
    marketingConsent: false
  },

  // Invalid registration data (multiple errors)
  invalidRegistration: {
    email: 'invalid-email',
    password: '123',
    confirmPassword: '456',
    firstName: '',
    lastName: 'D',
    username: 'a',
    phoneNumber: '123',
    age: 5,
    gender: 'invalid' as any,
    bio: 'A'.repeat(501), // Too long
    location: {
      city: 'A'.repeat(101), // Too long
      state: '',
      country: '',
      zipCode: 'invalid'
    },
    agreeToTerms: false,
    agreeToPrivacy: false
  },

  // Edge cases
  edgeCases: {
    // Minimum valid data
    minimal: {
      email: 'min@test.co',
      password: 'MinPass1!',
      confirmPassword: 'MinPass1!',
      firstName: 'A',
      lastName: 'B',
      agreeToTerms: true,
      agreeToPrivacy: true
    },

    // Maximum length data
    maximal: {
      email: 'a'.repeat(240) + '@example.com', // Near max length
      password: 'A'.repeat(120) + '1!', // Near max length
      confirmPassword: 'A'.repeat(120) + '1!',
      firstName: 'A'.repeat(50), // Max length
      lastName: 'B'.repeat(50), // Max length
      username: 'a'.repeat(30), // Max length
      phoneNumber: '+1 (555) 123-4567',
      age: 120, // Max age
      bio: 'A'.repeat(500), // Max length
      agreeToTerms: true,
      agreeToPrivacy: true
    },

    // Special characters in names
    specialNames: {
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: "Mary-Jane O'Connor",
      lastName: "Van Der Berg-Smith",
      agreeToTerms: true,
      agreeToPrivacy: true
    }
  },

  // Password strength test cases
  passwords: {
    weak: [
      '123456',
      'password',
      'qwerty',
      'abc123',
      'Password',
      '12345678'
    ],
    medium: [
      'Password1',
      'MyPass123',
      'Test1234',
      'Hello123'
    ],
    strong: [
      'SecurePass123!',
      'MyStr0ng!P@ssw0rd',
      'C0mpl3x!P@ssw0rd',
      'Sup3r$ecur3P@ss!'
    ]
  },

  // Email test cases
  emails: {
    valid: [
      'test@example.com',
      'user.name@domain.co.uk',
      'firstname+lastname@company.org',
      'email@123.123.123.123', // IP address
      'user@domain-name.com'
    ],
    invalid: [
      'invalid-email',
      '@domain.com',
      'user@',
      'user..name@domain.com',
      'user@domain',
      'user name@domain.com'
    ]
  },

  // Phone number test cases
  phoneNumbers: {
    valid: [
      '(555) 123-4567',
      '555-123-4567',
      '555.123.4567',
      '5551234567',
      '+1 555 123 4567',
      '+1-555-123-4567'
    ],
    invalid: [
      '123',
      '555-123',
      '555-123-456',
      '555-123-45678',
      'abc-def-ghij',
      '+1 555 123 456'
    ]
  }
};

// Test functions
export const validationTests = {
  /**
   * Test registration schema with various data sets
   */
  testRegistrationSchema: () => {
    console.log('🧪 Testing Registration Schema');
    console.log('==============================');

    // Test valid data
    const validResult = registrationSchema.safeParse(testData.validRegistration);
    console.log('✅ Valid registration:', validResult.success);
    if (!validResult.success) {
      console.error('Unexpected validation errors:', validResult.error.issues);
    }

    // Test invalid data
    const invalidResult = registrationSchema.safeParse(testData.invalidRegistration);
    console.log('❌ Invalid registration (expected):', !invalidResult.success);
    if (!invalidResult.success) {
      console.log('Validation errors:', validationUtils.formatErrors(invalidResult.error));
    }

    // Test edge cases
    const minimalResult = registrationSchema.safeParse(testData.edgeCases.minimal);
    console.log('✅ Minimal valid data:', minimalResult.success);

    const maximalResult = registrationSchema.safeParse(testData.edgeCases.maximal);
    console.log('✅ Maximal valid data:', maximalResult.success);

    const specialNamesResult = registrationSchema.safeParse(testData.edgeCases.specialNames);
    console.log('✅ Special characters in names:', specialNamesResult.success);

    console.log('');
  },

  /**
   * Test password strength function
   */
  testPasswordStrength: () => {
    console.log('🔒 Testing Password Strength');
    console.log('============================');

    // Test weak passwords
    console.log('Weak passwords:');
    testData.passwords.weak.forEach(password => {
      const strength = getPasswordStrength(password);
      console.log(`  "${password}": Score ${strength.score}/6, Strong: ${strength.isStrong}`);
    });

    // Test medium passwords
    console.log('\nMedium passwords:');
    testData.passwords.medium.forEach(password => {
      const strength = getPasswordStrength(password);
      console.log(`  "${password}": Score ${strength.score}/6, Strong: ${strength.isStrong}`);
    });

    // Test strong passwords
    console.log('\nStrong passwords:');
    testData.passwords.strong.forEach(password => {
      const strength = getPasswordStrength(password);
      console.log(`  "${password}": Score ${strength.score}/6, Strong: ${strength.isStrong}`);
    });

    console.log('');
  },

  /**
   * Test common validation schemas
   */
  testCommonSchemas: () => {
    console.log('📧 Testing Common Schemas');
    console.log('=========================');

    // Test email validation
    console.log('Email validation:');
    testData.emails.valid.forEach(email => {
      const result = commonSchemas.email.safeParse(email);
      console.log(`  "${email}": ${result.success ? '✅' : '❌'}`);
    });

    testData.emails.invalid.forEach(email => {
      const result = commonSchemas.email.safeParse(email);
      console.log(`  "${email}": ${result.success ? '❌ (unexpected)' : '✅ (correctly rejected)'}`);
    });

    // Test phone number validation
    console.log('\nPhone number validation:');
    testData.phoneNumbers.valid.forEach(phone => {
      const result = commonSchemas.phoneNumber.safeParse(phone);
      console.log(`  "${phone}": ${result.success ? '✅' : '❌'}`);
    });

    testData.phoneNumbers.invalid.forEach(phone => {
      const result = commonSchemas.phoneNumber.safeParse(phone);
      console.log(`  "${phone}": ${result.success ? '❌ (unexpected)' : '✅ (correctly rejected)'}`);
    });

    console.log('');
  },

  /**
   * Test validation utilities
   */
  testValidationUtils: () => {
    console.log('🛠️ Testing Validation Utilities');
    console.log('===============================');

    // Test field validation
    const emailResult = validationUtils.validateField(
      commonSchemas.email,
      'test@example.com'
    );
    console.log('Field validation (valid email):', emailResult);

    const invalidEmailResult = validationUtils.validateField(
      commonSchemas.email,
      'invalid-email'
    );
    console.log('Field validation (invalid email):', invalidEmailResult);

    // Test phone formatting
    const rawPhone = '5551234567';
    const formattedPhone = validationUtils.formatPhone(rawPhone);
    console.log(`Phone formatting: "${rawPhone}" → "${formattedPhone}"`);

    // Test string sanitization
    const messyString = '  Hello    World  ';
    const cleanString = validationUtils.sanitizeString(messyString);
    console.log(`String sanitization: "${messyString}" → "${cleanString}"`);

    console.log('');
  },

  /**
   * Test error formatting
   */
  testErrorFormatting: () => {
    console.log('🚨 Testing Error Formatting');
    console.log('===========================');

    const invalidData = {
      email: 'invalid',
      password: '123',
      firstName: '',
      age: 5
    };

    const result = registrationSchema.safeParse(invalidData);
    if (!result.success) {
      const formattedErrors = validationUtils.formatErrors(result.error);
      console.log('Formatted errors by field:');
      Object.entries(formattedErrors).forEach(([field, errors]) => {
        console.log(`  ${field}:`);
        errors.forEach(error => console.log(`    - ${error}`));
      });
    }

    console.log('');
  },

  /**
   * Run all tests
   */
  runAllTests: () => {
    console.log('🚀 Running All Validation Tests');
    console.log('================================\n');

    validationTests.testRegistrationSchema();
    validationTests.testPasswordStrength();
    validationTests.testCommonSchemas();
    validationTests.testValidationUtils();
    validationTests.testErrorFormatting();

    console.log('✅ All validation tests completed!');
  }
};

// Performance test
export const performanceTest = {
  /**
   * Test validation performance with large datasets
   */
  testPerformance: (iterations: number = 1000) => {
    console.log(`⚡ Testing Validation Performance (${iterations} iterations)`);
    console.log('=========================================================');

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      registrationSchema.safeParse(testData.validRegistration);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per validation: ${avgTime.toFixed(4)}ms`);
    console.log(`Validations per second: ${(1000 / avgTime).toFixed(0)}`);
    console.log('');
  }
};

// Export for use in tests or demos
export default {
  testData,
  validationTests,
  performanceTest
};
