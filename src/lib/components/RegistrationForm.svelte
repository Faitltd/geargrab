<script lang="ts">
  import { validateRegistration, getPasswordStrength, type RegistrationData } from '$lib/validation/registration';
  
  // Form data
  let formData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    age: '',
    gender: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  };
  
  // Form state
  let errors: Record<string, string> = {};
  let isSubmitting = false;
  let passwordStrength = { score: 0, feedback: [] as string[], isStrong: false };

  // Update password strength in real-time
  $: if (formData.password) {
    passwordStrength = getPasswordStrength(formData.password);
  } else {
    passwordStrength = { score: 0, feedback: [] as string[], isStrong: false };
  }

  async function handleSubmit() {
    isSubmitting = true;
    errors = {};

    try {
      // Convert form data to proper types
      const registrationData: RegistrationData = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender as any || undefined,
        agreeToTerms: formData.agreeToTerms,
        agreeToPrivacy: formData.agreeToPrivacy
      };

      // Validate with our custom validation
      const validationResult = validateRegistration(registrationData);

      if (!validationResult.success) {
        errors.general = validationResult.error || 'Validation failed';
        return;
      }

      console.log('✅ Form validation passed:', registrationData);

      // Here you would typically send the data to your API
      alert('Registration form submitted successfully! (This is a test component)');

    } catch (error) {
      console.error('❌ Validation failed:', error);
      errors.general = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="registration-form-container">
  <div class="form-header">
    <h2>Registration Form</h2>
    <p>This is a test component for form validation</p>
  </div>
  
  <form on:submit|preventDefault={handleSubmit} class="registration-form">
    <!-- Email -->
    <div class="form-group">
      <label for="email">Email *</label>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        class:error={errors.email}
        placeholder="your@email.com"
        required
      />
      {#if errors.email}
        <span class="error-message">{errors.email}</span>
      {/if}
    </div>
    
    <!-- Password -->
    <div class="form-group">
      <label for="password">Password *</label>
      <input
        id="password"
        type="password"
        bind:value={formData.password}
        class:error={errors.password}
        placeholder="Enter a strong password"
        required
      />
      {#if formData.password}
        <div class="password-strength">
          <div class="strength-bar">
            <div 
              class="strength-fill strength-{passwordStrength.score}"
              style="width: {(passwordStrength.score / 6) * 100}%"
            ></div>
          </div>
          <span class="strength-text {passwordStrength.isStrong ? 'strong' : 'weak'}">
            {passwordStrength.isStrong ? 'Strong' : 'Weak'} ({passwordStrength.score}/6)
          </span>
        </div>
      {/if}
      {#if errors.password}
        <span class="error-message">{errors.password}</span>
      {/if}
    </div>
    
    <!-- Confirm Password -->
    <div class="form-group">
      <label for="confirmPassword">Confirm Password *</label>
      <input
        id="confirmPassword"
        type="password"
        bind:value={formData.confirmPassword}
        class:error={errors.confirmPassword}
        placeholder="Confirm your password"
        required
      />
      {#if errors.confirmPassword}
        <span class="error-message">{errors.confirmPassword}</span>
      {/if}
    </div>
    
    <!-- Name Fields -->
    <div class="form-row">
      <div class="form-group">
        <label for="firstName">First Name *</label>
        <input
          id="firstName"
          type="text"
          bind:value={formData.firstName}
          class:error={errors.firstName}
          placeholder="John"
          required
        />
        {#if errors.firstName}
          <span class="error-message">{errors.firstName}</span>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="lastName">Last Name *</label>
        <input
          id="lastName"
          type="text"
          bind:value={formData.lastName}
          class:error={errors.lastName}
          placeholder="Doe"
          required
        />
        {#if errors.lastName}
          <span class="error-message">{errors.lastName}</span>
        {/if}
      </div>
    </div>
    
    <!-- Username -->
    <div class="form-group">
      <label for="username">Username</label>
      <input
        id="username"
        type="text"
        bind:value={formData.username}
        class:error={errors.username}
        placeholder="johndoe123"
      />
      {#if errors.username}
        <span class="error-message">{errors.username}</span>
      {/if}
    </div>
    
    <!-- Phone -->
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
        <span class="error-message">{errors.phoneNumber}</span>
      {/if}
    </div>
    
    <!-- Age and Gender -->
    <div class="form-row">
      <div class="form-group">
        <label for="age">Age</label>
        <input
          id="age"
          type="number"
          bind:value={formData.age}
          class:error={errors.age}
          placeholder="25"
          min="13"
          max="120"
        />
        {#if errors.age}
          <span class="error-message">{errors.age}</span>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="gender">Gender</label>
        <select
          id="gender"
          bind:value={formData.gender}
          class:error={errors.gender}
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
        {#if errors.gender}
          <span class="error-message">{errors.gender}</span>
        {/if}
      </div>
    </div>
    
    <!-- Agreements -->
    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={formData.agreeToTerms}
          class:error={errors.agreeToTerms}
        />
        I agree to the Terms of Service *
      </label>
      {#if errors.agreeToTerms}
        <span class="error-message">{errors.agreeToTerms}</span>
      {/if}
    </div>
    
    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={formData.agreeToPrivacy}
          class:error={errors.agreeToPrivacy}
        />
        I agree to the Privacy Policy *
      </label>
      {#if errors.agreeToPrivacy}
        <span class="error-message">{errors.agreeToPrivacy}</span>
      {/if}
    </div>
    
    <!-- Submit Button -->
    <button
      type="submit"
      disabled={isSubmitting}
      class="submit-button"
    >
      {isSubmitting ? 'Submitting...' : 'Register'}
    </button>
  </form>
</div>

<style>
  .registration-form-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .form-header h2 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .form-header p {
    color: #7f8c8d;
  }
  
  .registration-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-group label {
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #2c3e50;
  }
  
  .form-group input,
  .form-group select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  .form-group input.error,
  .form-group select.error {
    border-color: #e74c3c;
  }
  
  .error-message {
    color: #e74c3c;
    font-size: 0.875rem;
    margin-top: 0.25rem;
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
    margin-bottom: 0.25rem;
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
    font-weight: 500;
  }
  
  .strength-text.strong {
    color: #27ae60;
  }
  
  .strength-text.weak {
    color: #e74c3c;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .checkbox-label input[type="checkbox"] {
    width: auto;
  }
  
  .submit-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .submit-button:hover:not(:disabled) {
    background: #2980b9;
  }
  
  .submit-button:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
  
  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .registration-form-container {
      padding: 1rem;
    }
  }
</style>
