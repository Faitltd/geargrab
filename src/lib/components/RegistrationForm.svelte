<script lang="ts">
  import { registrationSchema, getPasswordStrength, type RegistrationFormData } from '$lib/validation/registration';
  import { z } from 'zod';

  /**
   * Registration Form Component with Zod Validation
   * 
   * Features:
   * - Real-time validation using Zod schema
   * - Password strength indicator
   * - Step-by-step form validation
   * - Comprehensive error handling
   * - Type-safe form data
   */

  // Form data with proper typing
  let formData: Partial<RegistrationFormData> = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    age: undefined,
    dateOfBirth: '',
    gender: undefined,
    bio: '',
    location: {
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    preferences: {
      newsletter: false,
      marketing: false,
      notifications: true,
      theme: 'auto'
    },
    agreeToTerms: false,
    agreeToPrivacy: false,
    marketingConsent: false
  };

  // Validation state
  let errors: Record<string, string[]> = {};
  let isSubmitting = false;
  let submitSuccess = false;
  let submitMessage = '';

  // Password strength state
  let passwordStrength = { score: 0, feedback: [], isStrong: false };

  // Real-time validation functions
  function validateField(fieldName: keyof RegistrationFormData, value: any) {
    try {
      const fieldSchema = registrationSchema.shape[fieldName];
      fieldSchema.parse(value);
      
      // Clear errors for this field
      if (errors[fieldName]) {
        delete errors[fieldName];
        errors = { ...errors };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors[fieldName] = error.issues.map(issue => issue.message);
        errors = { ...errors };
      }
    }
  }

  // Password strength validation
  function updatePasswordStrength() {
    if (formData.password) {
      passwordStrength = getPasswordStrength(formData.password);
    } else {
      passwordStrength = { score: 0, feedback: [], isStrong: false };
    }
  }

  // Handle form submission
  async function handleSubmit() {
    isSubmitting = true;
    errors = {};
    
    try {
      // Validate entire form
      const validationResult = registrationSchema.safeParse(formData);
      
      if (!validationResult.success) {
        // Group errors by field
        validationResult.error.issues.forEach(issue => {
          const fieldPath = issue.path.join('.');
          const fieldName = fieldPath || 'general';
          
          if (!errors[fieldName]) {
            errors[fieldName] = [];
          }
          errors[fieldName].push(issue.message);
        });
        
        errors = { ...errors };
        isSubmitting = false;
        return;
      }

      // Submit to API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validationResult.data)
      });

      const result = await response.json();

      if (result.success) {
        submitSuccess = true;
        submitMessage = result.message;
        console.log('✅ Registration successful:', result);
      } else {
        submitSuccess = false;
        submitMessage = result.message || 'Registration failed';
        
        if (result.fieldErrors) {
          errors = result.fieldErrors;
        }
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      submitSuccess = false;
      submitMessage = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  // Reactive statements for real-time validation
  $: if (formData.email) validateField('email', formData.email);
  $: if (formData.password) {
    validateField('password', formData.password);
    updatePasswordStrength();
  }
  $: if (formData.confirmPassword && formData.password) {
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match'];
      errors = { ...errors };
    } else if (errors.confirmPassword) {
      delete errors.confirmPassword;
      errors = { ...errors };
    }
  }
  $: if (formData.firstName) validateField('firstName', formData.firstName);
  $: if (formData.lastName) validateField('lastName', formData.lastName);
</script>

<div class="registration-form">
  <h2>Create Your Account</h2>
  
  {#if submitSuccess}
    <div class="success-message">
      <h3>✅ Registration Successful!</h3>
      <p>{submitMessage}</p>
    </div>
  {:else}
    <form on:submit|preventDefault={handleSubmit}>
      <!-- Step 1: Basic Information -->
      <fieldset>
        <legend>Basic Information</legend>
        
        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            class:error={errors.email}
            required
          />
          {#if errors.email}
            <div class="error-messages">
              {#each errors.email as error}
                <span class="error">{error}</span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="password">Password *</label>
          <input
            id="password"
            type="password"
            bind:value={formData.password}
            class:error={errors.password}
            required
          />
          
          <!-- Password Strength Indicator -->
          {#if formData.password}
            <div class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill strength-{passwordStrength.score}"
                  style="width: {(passwordStrength.score / 6) * 100}%"
                ></div>
              </div>
              <div class="strength-text">
                Strength: {passwordStrength.isStrong ? 'Strong' : 'Weak'}
              </div>
              {#if passwordStrength.feedback.length > 0}
                <ul class="strength-feedback">
                  {#each passwordStrength.feedback as feedback}
                    <li>{feedback}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
          
          {#if errors.password}
            <div class="error-messages">
              {#each errors.password as error}
                <span class="error">{error}</span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={formData.confirmPassword}
            class:error={errors.confirmPassword}
            required
          />
          {#if errors.confirmPassword}
            <div class="error-messages">
              {#each errors.confirmPassword as error}
                <span class="error">{error}</span>
              {/each}
            </div>
          {/if}
        </div>
      </fieldset>

      <!-- Step 2: Personal Information -->
      <fieldset>
        <legend>Personal Information</legend>
        
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">First Name *</label>
            <input
              id="firstName"
              type="text"
              bind:value={formData.firstName}
              class:error={errors.firstName}
              required
            />
            {#if errors.firstName}
              <div class="error-messages">
                {#each errors.firstName as error}
                  <span class="error">{error}</span>
                {/each}
              </div>
            {/if}
          </div>

          <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input
              id="lastName"
              type="text"
              bind:value={formData.lastName}
              class:error={errors.lastName}
              required
            />
            {#if errors.lastName}
              <div class="error-messages">
                {#each errors.lastName as error}
                  <span class="error">{error}</span>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label for="username">Username (optional)</label>
          <input
            id="username"
            type="text"
            bind:value={formData.username}
            class:error={errors.username}
            placeholder="3-30 characters, letters, numbers, _, -"
          />
          {#if errors.username}
            <div class="error-messages">
              {#each errors.username as error}
                <span class="error">{error}</span>
              {/each}
            </div>
          {/if}
        </div>
      </fieldset>

      <!-- Step 3: Optional Information -->
      <fieldset>
        <legend>Additional Information (Optional)</legend>
        
        <div class="form-group">
          <label for="phoneNumber">Phone Number</label>
          <input
            id="phoneNumber"
            type="tel"
            bind:value={formData.phoneNumber}
            class:error={errors.phoneNumber}
            placeholder="(555) 123-4567"
          />
          {#if errors.phoneNumber}
            <div class="error-messages">
              {#each errors.phoneNumber as error}
                <span class="error">{error}</span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="age">Age</label>
            <input
              id="age"
              type="number"
              bind:value={formData.age}
              class:error={errors.age}
              min="13"
              max="120"
            />
          </div>

          <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" bind:value={formData.gender}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- Step 4: Terms and Conditions -->
      <fieldset>
        <legend>Terms and Conditions</legend>
        
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={formData.agreeToTerms}
              class:error={errors.agreeToTerms}
              required
            />
            I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> *
          </label>
          {#if errors.agreeToTerms}
            <div class="error-messages">
              {#each errors.agreeToTerms as error}
                <span class="error">{error}</span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={formData.agreeToPrivacy}
              class:error={errors.agreeToPrivacy}
              required
            />
            I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> *
          </label>
          {#if errors.agreeToPrivacy}
            <div class="error-messages">
              {#each errors.agreeToPrivacy as error}
                <span class="error">{error}</span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={formData.marketingConsent}
            />
            I would like to receive marketing emails and updates
          </label>
        </div>
      </fieldset>

      <!-- Submit Button -->
      <div class="form-actions">
        <button 
          type="submit" 
          disabled={isSubmitting}
          class="submit-button"
        >
          {#if isSubmitting}
            Creating Account...
          {:else}
            Create Account
          {/if}
        </button>
      </div>

      <!-- Error Message -->
      {#if !submitSuccess && submitMessage}
        <div class="error-message">
          {submitMessage}
        </div>
      {/if}
    </form>
  {/if}
</div>

<style>
  .registration-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }

  fieldset {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  legend {
    font-weight: bold;
    padding: 0 0.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input.error, select.error {
    border-color: #e74c3c;
    background-color: #fdf2f2;
  }

  .error-messages {
    margin-top: 0.25rem;
  }

  .error {
    color: #e74c3c;
    font-size: 0.875rem;
    display: block;
  }

  .password-strength {
    margin-top: 0.5rem;
  }

  .strength-bar {
    width: 100%;
    height: 4px;
    background-color: #eee;
    border-radius: 2px;
    overflow: hidden;
  }

  .strength-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .strength-fill.strength-0,
  .strength-fill.strength-1,
  .strength-fill.strength-2 { background-color: #e74c3c; }
  .strength-fill.strength-3,
  .strength-fill.strength-4 { background-color: #f39c12; }
  .strength-fill.strength-5,
  .strength-fill.strength-6 { background-color: #27ae60; }

  .strength-text {
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .strength-feedback {
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.25rem;
    padding-left: 1rem;
  }

  .checkbox-group {
    margin-bottom: 1rem;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #2980b9;
  }

  .submit-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  .success-message {
    text-align: center;
    padding: 2rem;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 8px;
    color: #155724;
  }

  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    color: #721c24;
    text-align: center;
  }

  a {
    color: #3498db;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
