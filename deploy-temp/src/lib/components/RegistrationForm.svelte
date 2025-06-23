<script lang="ts">
  /**
   * Simple Registration Form Component
   *
   * Features:
   * - Basic HTML5 validation
   * - Simple password confirmation check
   * - Clean form handling
   */

  // Simple form data interface
  interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    age: number | undefined;
    gender: string;
    agreeToTerms: boolean;
    agreeToPrivacy: boolean;
    marketingConsent: boolean;
  }

  // Form data
  let formData: FormData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    age: undefined,
    gender: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    marketingConsent: false
  };

  // Validation state
  let errors: Record<string, string> = {};
  let isSubmitting = false;
  let submitSuccess = false;
  let submitMessage = '';

  // Simple validation functions
  function validateEmail(email: string): string | null {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    return null;
  }

  function validatePassword(password: string): string | null {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  }

  function validateRequired(value: string, fieldName: string): string | null {
    if (!value || value.trim() === '') return `${fieldName} is required`;
    return null;
  }

  // Handle form submission
  async function handleSubmit() {
    isSubmitting = true;
    errors = {};

    try {
      // Simple validation
      const emailError = validateEmail(formData.email);
      const passwordError = validatePassword(formData.password);
      const firstNameError = validateRequired(formData.firstName, 'First name');
      const lastNameError = validateRequired(formData.lastName, 'Last name');

      if (emailError) errors.email = emailError;
      if (passwordError) errors.password = passwordError;
      if (firstNameError) errors.firstName = firstNameError;
      if (lastNameError) errors.lastName = lastNameError;

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the terms and conditions';
      }

      if (!formData.agreeToPrivacy) {
        errors.agreeToPrivacy = 'You must agree to the privacy policy';
      }

      // If there are errors, stop submission
      if (Object.keys(errors).length > 0) {
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
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        submitSuccess = true;
        submitMessage = result.message || 'Registration successful!';
        console.log('✅ Registration successful:', result);
      } else {
        submitSuccess = false;
        submitMessage = result.message || 'Registration failed';
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      submitSuccess = false;
      submitMessage = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  // Simple reactive validation for password confirmation
  $: if (formData.confirmPassword && formData.password) {
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      errors = { ...errors };
    } else if (errors.confirmPassword) {
      delete errors.confirmPassword;
      errors = { ...errors };
    }
  }
</script>

<div class="registration-form">
  <h2>Create Your Account</h2>
  
  {#if submitSuccess}
    <div class="success-message">
      <h3>✅ Registration Successful!</h3>
      <p>{submitMessage}</p>
    </div>
  {:else}
    <form on:submit|preventDefault="{handleSubmit}">
      <!-- Step 1: Basic Information -->
      <fieldset>
        <legend>Basic Information</legend>
        
        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            id="email"
            type="email"
            bind:value="{formData.email}"
            class:error="{errors.email}"
            required
          />
          {#if errors.email}
            <div class="error-messages">
              <span class="error">{errors.email}</span>
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="password">Password *</label>
          <input
            id="password"
            type="password"
            bind:value="{formData.password}"
            class:error="{errors.password}"
            required
          />
          
          <!-- Simple password hint -->
          {#if formData.password && formData.password.length < 8}
            <div class="password-hint">
              <small class="text-gray-500">Password must be at least 8 characters</small>
            </div>
          {/if}
          
          {#if errors.password}
            <div class="error-messages">
              <span class="error">{errors.password}</span>
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            type="password"
            bind:value="{formData.confirmPassword}"
            class:error="{errors.confirmPassword}"
            required
          />
          {#if errors.confirmPassword}
            <div class="error-messages">
              <span class="error">{errors.confirmPassword}</span>
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
              bind:value="{formData.firstName}"
              class:error="{errors.firstName}"
              required
            />
            {#if errors.firstName}
              <div class="error-messages">
                <span class="error">{errors.firstName}</span>
              </div>
            {/if}
          </div>

          <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input
              id="lastName"
              type="text"
              bind:value="{formData.lastName}"
              class:error="{errors.lastName}"
              required
            />
            {#if errors.lastName}
              <div class="error-messages">
                <span class="error">{errors.lastName}</span>
              </div>
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label for="username">Username (optional)</label>
          <input
            id="username"
            type="text"
            bind:value="{formData.username}"
            class:error="{errors.username}"
            placeholder="3-30 characters, letters, numbers, _, -"
          />
          {#if errors.username}
            <div class="error-messages">
              <span class="error">{errors.username}</span>
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
            bind:value="{formData.phoneNumber}"
            class:error="{errors.phoneNumber}"
            placeholder="(555) 123-4567"
          />
          {#if errors.phoneNumber}
            <div class="error-messages">
              <span class="error">{errors.phoneNumber}</span>
            </div>
          {/if}
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="age">Age</label>
            <input
              id="age"
              type="number"
              bind:value="{formData.age}"
              class:error="{errors.age}"
              min="13"
              max="120"
            />
          </div>

          <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" bind:value="{formData.gender}">
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
              bind:checked="{formData.agreeToTerms}"
              class:error="{errors.agreeToTerms}"
              required
            />
            I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> *
          </label>
          {#if errors.agreeToTerms}
            <div class="error-messages">
              <span class="error">{errors.agreeToTerms}</span>
            </div>
          {/if}
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked="{formData.agreeToPrivacy}"
              class:error="{errors.agreeToPrivacy}"
              required
            />
            I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> *
          </label>
          {#if errors.agreeToPrivacy}
            <div class="error-messages">
              <span class="error">{errors.agreeToPrivacy}</span>
            </div>
          {/if}
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked="{formData.marketingConsent}"
            />
            I would like to receive marketing emails and updates
          </label>
        </div>
      </fieldset>

      <!-- Submit Button -->
      <div class="form-actions">
        <button 
          type="submit" 
          disabled="{isSubmitting}"
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
