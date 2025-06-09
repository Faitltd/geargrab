<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { notifications } from '$lib/stores/notifications';
  import { isValidEmail, isValidPassword } from '$lib/utils/validation';
  import { signInWithGoogle } from '$lib/firebase/auth';

  // Personal Information
  let firstName = '';
  let lastName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let phone = '';
  let dateOfBirth = '';
  let ssn = '';
  let driverLicenseNumber = '';

  // Address Information
  let address = {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  };

  // Consent and Terms
  let agreeTerms = false;
  let consentGiven = false;
  let loading = false;
  let errors: Record<string, string> = {};
  let currentStep = 1;
  let totalSteps = 3;
  
  // Get redirect URL from query parameters
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';

  // US States for dropdown
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Validate current step
  function validateStep(step: number) {
    errors = {};
    let isValid = true;

    if (step === 1) {
      // Personal Information
      if (!firstName) {
        errors.firstName = 'First name is required';
        isValid = false;
      }

      if (!lastName) {
        errors.lastName = 'Last name is required';
        isValid = false;
      }

      if (!email) {
        errors.email = 'Email is required';
        isValid = false;
      } else if (!isValidEmail(email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }

      if (!phone) {
        errors.phone = 'Phone number is required';
        isValid = false;
      }

      if (!dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
        isValid = false;
      } else {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          errors.dateOfBirth = 'You must be at least 18 years old';
          isValid = false;
        }
      }

      if (!ssn) {
        errors.ssn = 'Social Security Number is required';
        isValid = false;
      } else if (!/^\d{3}-?\d{2}-?\d{4}$/.test(ssn)) {
        errors.ssn = 'Please enter a valid SSN (XXX-XX-XXXX)';
        isValid = false;
      }
    }

    if (step === 2) {
      // Address Information
      if (!address.street) {
        errors.street = 'Street address is required';
        isValid = false;
      }

      if (!address.city) {
        errors.city = 'City is required';
        isValid = false;
      }

      if (!address.state) {
        errors.state = 'State is required';
        isValid = false;
      }

      if (!address.zipCode) {
        errors.zipCode = 'ZIP code is required';
        isValid = false;
      } else if (!/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
        errors.zipCode = 'Please enter a valid ZIP code';
        isValid = false;
      }

      if (!password) {
        errors.password = 'Password is required';
        isValid = false;
      } else if (!isValidPassword(password)) {
        errors.password = 'Password must be at least 8 characters with 1 uppercase letter, 1 lowercase letter, and 1 number';
        isValid = false;
      }

      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    if (step === 3) {
      // Consent and Terms
      if (!agreeTerms) {
        errors.agreeTerms = 'You must agree to the terms and conditions';
        isValid = false;
      }

      if (!consentGiven) {
        errors.consentGiven = 'You must consent to the background check';
        isValid = false;
      }
    }

    return isValid;
  }

  // Navigate between steps
  function nextStep() {
    if (validateStep(currentStep)) {
      currentStep++;
    }
  }

  function prevStep() {
    currentStep--;
    errors = {};
  }
  
  // Handle form submission
  async function handleSubmit() {
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    if (!validateStep(3)) return;

    loading = true;
    errors = {};

    try {
      // Format SSN for API
      const formattedSSN = ssn.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');

      // Submit FCRA-compliant registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          phone,
          dateOfBirth,
          ssn: formattedSSN,
          address,
          driverLicenseNumber,
          consentGiven
        })
      });

      const result = await response.json();

      if (response.ok) {
        notifications.success('Registration submitted successfully! Background check in progress.');
        notifications.info(result.data?.nextSteps || 'You will receive an email once your background check is complete.');
        goto('/auth/registration-pending');
      } else {
        if (result.missingFields) {
          result.missingFields.forEach((field: string) => {
            errors[field] = `${field} is required`;
          });
        } else {
          errors.auth = result.message || result.error || 'Registration failed';
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      errors.auth = 'An error occurred during registration. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Format SSN input
  function formatSSN(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = value.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
    } else if (value.length >= 4) {
      value = value.replace(/(\d{3})(\d{2})/, '$1-$2');
    }
    ssn = value;
  }

  // Format phone input
  function formatPhone(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 7) {
      value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 4) {
      value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
    }
    phone = value;
  }

  // Handle Google sign-in
  async function handleGoogleSignIn() {
    loading = true;
    errors = {};

    try {
      console.log('🔐 Starting Google sign-up process...');
      const result = await signInWithGoogle();

      console.log('✅ Google sign-up successful:', result.user.email);

      notifications.add({
        type: 'success',
        message: `Successfully signed up with Google! Welcome, ${result.user.displayName || result.user.email}`,
        timeout: 5000
      });

      // Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to redirect URL
      await goto(redirectTo);
    } catch (error: any) {
      console.error('❌ Google sign-up error:', error);

      // Show user-friendly error message
      errors.auth = error.message || 'An error occurred during Google sign-up';

      notifications.add({
        type: 'error',
        message: errors.auth,
        timeout: 8000
      });
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign Up - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-30 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
  <div class="max-w-2xl w-full space-y-8">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-center">
      <h1 class="text-3xl font-extrabold text-white">
        Create your GearGrab account
      </h1>
      <p class="mt-2 text-sm text-gray-300">
        Step {currentStep} of {totalSteps} -
        {#if currentStep === 1}Personal Information
        {:else if currentStep === 2}Address & Security
        {:else}Consent & Terms
        {/if}
      </p>
      <p class="mt-1 text-xs text-gray-400">
        Or
        <a href="/auth/login" class="font-medium text-green-400 hover:text-green-300">
          sign in to your existing account
        </a>
      </p>
    </div>

    <!-- Google Sign-in Option -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="text-center">
        <p class="text-sm text-gray-300 mb-4">Quick signup with Google</p>
        <button
          type="button"
          class="w-full flex justify-center items-center px-4 py-3 border border-white/20 rounded-md shadow-sm bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          on:click={handleGoogleSignIn}
          disabled={loading}
        >
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing up...' : 'Continue with Google'}
        </button>
        <div class="mt-4 relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/20"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-transparent text-gray-300">Or continue with email</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-300">Progress</span>
        <span class="text-sm text-gray-300">{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div
          class="bg-green-500 h-2 rounded-full transition-all duration-300"
          style="width: {(currentStep / totalSteps) * 100}%"
        ></div>
      </div>
    </div>
    
    {#if errors.auth}
      <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-200">
              {errors.auth}
            </h3>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Multi-Step Registration Form -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <form class="space-y-6" on:submit|preventDefault={handleSubmit}>

        {#if currentStep === 1}
          <!-- Step 1: Personal Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-white mb-4">Personal Information</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="first-name" class="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <input
                  id="first-name"
                  name="firstName"
                  type="text"
                  autocomplete="given-name"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="First name"
                  bind:value={firstName}
                />
                {#if errors.firstName}
                  <p class="mt-1 text-sm text-red-300">{errors.firstName}</p>
                {/if}
              </div>

              <div>
                <label for="last-name" class="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  id="last-name"
                  name="lastName"
                  type="text"
                  autocomplete="family-name"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Last name"
                  bind:value={lastName}
                />
                {#if errors.lastName}
                  <p class="mt-1 text-sm text-red-300">{errors.lastName}</p>
                {/if}
              </div>
            </div>

            <div>
              <label for="email-address" class="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                bind:value={email}
              />
              {#if errors.email}
                <p class="mt-1 text-sm text-red-300">{errors.email}</p>
              {/if}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autocomplete="tel"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="(555) 123-4567"
                  bind:value={phone}
                  on:input={formatPhone}
                />
                {#if errors.phone}
                  <p class="mt-1 text-sm text-red-300">{errors.phone}</p>
                {/if}
              </div>

              <div>
                <label for="date-of-birth" class="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
                <input
                  id="date-of-birth"
                  name="dateOfBirth"
                  type="date"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  bind:value={dateOfBirth}
                />
                {#if errors.dateOfBirth}
                  <p class="mt-1 text-sm text-red-300">{errors.dateOfBirth}</p>
                {/if}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="ssn" class="block text-sm font-medium text-gray-300 mb-1">Social Security Number</label>
                <input
                  id="ssn"
                  name="ssn"
                  type="text"
                  required
                  maxlength="11"
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="XXX-XX-XXXX"
                  bind:value={ssn}
                  on:input={formatSSN}
                />
                {#if errors.ssn}
                  <p class="mt-1 text-sm text-red-300">{errors.ssn}</p>
                {/if}
                <p class="mt-1 text-xs text-gray-400">Required for background check verification</p>
              </div>

              <div>
                <label for="driver-license" class="block text-sm font-medium text-gray-300 mb-1">Driver's License Number</label>
                <input
                  id="driver-license"
                  name="driverLicenseNumber"
                  type="text"
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Optional"
                  bind:value={driverLicenseNumber}
                />
                <p class="mt-1 text-xs text-gray-400">Optional but recommended</p>
              </div>
            </div>
          </div>
        {/if}

        {#if currentStep === 2}
          <!-- Step 2: Address & Security -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-white mb-4">Address & Security</h3>

            <div>
              <label for="street" class="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
              <input
                id="street"
                name="street"
                type="text"
                autocomplete="street-address"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="123 Main Street"
                bind:value={address.street}
              />
              {#if errors.street}
                <p class="mt-1 text-sm text-red-300">{errors.street}</p>
              {/if}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="city" class="block text-sm font-medium text-gray-300 mb-1">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autocomplete="address-level2"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="City"
                  bind:value={address.city}
                />
                {#if errors.city}
                  <p class="mt-1 text-sm text-red-300">{errors.city}</p>
                {/if}
              </div>

              <div>
                <label for="state" class="block text-sm font-medium text-gray-300 mb-1">State</label>
                <select
                  id="state"
                  name="state"
                  autocomplete="address-level1"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  bind:value={address.state}
                >
                  <option value="">Select State</option>
                  {#each states as state}
                    <option value={state}>{state}</option>
                  {/each}
                </select>
                {#if errors.state}
                  <p class="mt-1 text-sm text-red-300">{errors.state}</p>
                {/if}
              </div>

              <div>
                <label for="zip-code" class="block text-sm font-medium text-gray-300 mb-1">ZIP Code</label>
                <input
                  id="zip-code"
                  name="zipCode"
                  type="text"
                  autocomplete="postal-code"
                  required
                  maxlength="10"
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="12345"
                  bind:value={address.zipCode}
                />
                {#if errors.zipCode}
                  <p class="mt-1 text-sm text-red-300">{errors.zipCode}</p>
                {/if}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  bind:value={password}
                />
                {#if errors.password}
                  <p class="mt-1 text-sm text-red-300">{errors.password}</p>
                {/if}
              </div>

              <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="appearance-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                  bind:value={confirmPassword}
                />
                {#if errors.confirmPassword}
                  <p class="mt-1 text-sm text-red-300">{errors.confirmPassword}</p>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        {#if currentStep === 3}
          <!-- Step 3: Consent & Terms -->
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-white mb-4">Consent & Terms</h3>

            <!-- FCRA Background Check Consent -->
            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 class="text-yellow-300 font-medium mb-2">Background Check Authorization</h4>
              <p class="text-sm text-gray-300 mb-4">
                GearGrab requires a background check to verify your eligibility to rent or list gear on our platform.
                This helps ensure the safety and security of our community.
              </p>

              <div class="flex items-start">
                <input
                  id="consent-background-check"
                  name="consent-background-check"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-white/20 bg-white/10 rounded mt-1"
                  bind:checked={consentGiven}
                />
                <label for="consent-background-check" class="ml-3 block text-sm text-gray-300">
                  <strong>I authorize GearGrab to obtain a background check</strong> to verify my eligibility to rent or list gear for licensing purposes.
                  I understand my consumer report will be used solely to determine my eligibility and will be obtained from iProspectCheck, Inc.
                  I understand that I have rights under the Fair Credit Reporting Act.
                </label>
              </div>
              {#if errors.consentGiven}
                <p class="mt-2 text-sm text-red-300">{errors.consentGiven}</p>
              {/if}
            </div>

            <!-- Terms and Privacy Policy -->
            <div class="flex items-start">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-white/20 bg-white/10 rounded mt-1"
                bind:checked={agreeTerms}
              />
              <label for="agree-terms" class="ml-3 block text-sm text-gray-300">
                I agree to the
                <a href="/terms" target="_blank" class="text-green-400 hover:text-green-300 underline">Terms of Service</a>
                and
                <a href="/privacy" target="_blank" class="text-green-400 hover:text-green-300 underline">Privacy Policy</a>
              </label>
            </div>
            {#if errors.agreeTerms}
              <p class="mt-1 text-sm text-red-300">{errors.agreeTerms}</p>
            {/if}

            <!-- Important Notice -->
            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 class="text-blue-300 font-medium mb-2">What happens next?</h4>
              <ul class="text-sm text-gray-300 space-y-1">
                <li>• Your background check will be processed by iProspectCheck, Inc.</li>
                <li>• Most checks complete within 24-48 hours</li>
                <li>• You'll receive an email once your check is complete</li>
                <li>• If approved, you can immediately start using GearGrab</li>
                <li>• If there are any issues, we'll provide detailed next steps</li>
              </ul>
            </div>
          </div>
        {/if}

        <!-- Form Navigation -->
        <div class="flex justify-between pt-6">
          {#if currentStep > 1}
            <button
              type="button"
              class="flex justify-center py-2 px-4 border border-white/20 text-sm font-medium rounded-md text-gray-300 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              on:click={prevStep}
              disabled={loading}
            >
              Previous
            </button>
          {:else}
            <div></div>
          {/if}

          <button
            type="submit"
            class="group relative flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={loading}
          >
            {#if loading}
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {#if currentStep === 3}
                Submitting...
              {:else}
                Processing...
              {/if}
            {:else}
              {#if currentStep === 3}
                Create Account
              {:else}
                Next Step
              {/if}
            {/if}
          </button>
        </div>
      </form>
    </div>

    <!-- Important Notice -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="text-center">
        <h3 class="text-lg font-medium text-white mb-2">Secure Registration Process</h3>
        <p class="text-sm text-gray-300 mb-4">
          GearGrab uses industry-standard background checks to ensure the safety and security of our community.
          All personal information is encrypted and handled in compliance with FCRA regulations.
        </p>
        <div class="flex items-center justify-center space-x-4 text-xs text-gray-400">
          <div class="flex items-center">
            <svg class="h-4 w-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
            SSL Encrypted
          </div>
          <div class="flex items-center">
            <svg class="h-4 w-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            FCRA Compliant
          </div>
          <div class="flex items-center">
            <svg class="h-4 w-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            Privacy Protected
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
