<script>
  import { onMount } from 'svelte';
  import { base44 } from '../../../api/base44Client.js';
  import { user } from '../../stores/auth.js';
  
  let verificationStatus = {
    email_verified: false,
    phone_verified: false,
    id_verified: false,
    id_verification: null
  };
  
  let loading = false;
  let error = null;
  let phoneNumber = '';
  let verificationCode = '';
  let showPhoneInput = false;
  let showCodeInput = false;
  
  // Load verification status
  onMount(async () => {
    await loadVerificationStatus();
  });
  
  async function loadVerificationStatus() {
    try {
      loading = true;
      const response = await base44.entities.User.get('verification/status');
      verificationStatus = response;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function sendEmailVerification() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch('/api/verification/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }
      
      const data = await response.json();
      alert('Verification email sent! Please check your inbox.');
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function sendPhoneVerification() {
    if (!phoneNumber) {
      error = 'Please enter a phone number';
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      const response = await fetch('/api/verification/send-phone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send verification SMS');
      }
      
      showCodeInput = true;
      alert('Verification code sent to your phone!');
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function verifyPhone() {
    if (!verificationCode) {
      error = 'Please enter the verification code';
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      const response = await fetch('/api/verification/verify-phone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      });
      
      if (!response.ok) {
        throw new Error('Invalid verification code');
      }
      
      await loadVerificationStatus();
      showPhoneInput = false;
      showCodeInput = false;
      phoneNumber = '';
      verificationCode = '';
      alert('Phone number verified successfully!');
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Verification</h3>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <p class="text-red-800 text-sm">{error}</p>
    </div>
  {/if}
  
  <div class="space-y-4">
    <!-- Email Verification -->
    <div class="flex items-center justify-between p-4 border rounded-lg">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          {#if verificationStatus.email_verified}
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">Email Verification</p>
          <p class="text-sm text-gray-500">
            {verificationStatus.email_verified ? 'Verified' : 'Verify your email address'}
          </p>
        </div>
      </div>
      
      {#if !verificationStatus.email_verified}
        <button
          on:click={sendEmailVerification}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      {/if}
    </div>
    
    <!-- Phone Verification -->
    <div class="flex items-center justify-between p-4 border rounded-lg">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          {#if verificationStatus.phone_verified}
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">Phone Verification</p>
          <p class="text-sm text-gray-500">
            {verificationStatus.phone_verified ? 'Verified' : 'Verify your phone number'}
          </p>
        </div>
      </div>
      
      {#if !verificationStatus.phone_verified}
        <button
          on:click={() => showPhoneInput = !showPhoneInput}
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          Verify Phone
        </button>
      {/if}
    </div>
    
    <!-- Phone Input Form -->
    {#if showPhoneInput && !verificationStatus.phone_verified}
      <div class="p-4 bg-gray-50 rounded-lg space-y-3">
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            id="phone"
            bind:value={phoneNumber}
            placeholder="+1 (555) 123-4567"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          on:click={sendPhoneVerification}
          disabled={loading || !phoneNumber}
          class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </div>
    {/if}
    
    <!-- Code Input Form -->
    {#if showCodeInput}
      <div class="p-4 bg-gray-50 rounded-lg space-y-3">
        <div>
          <label for="code" class="block text-sm font-medium text-gray-700">Verification Code</label>
          <input
            type="text"
            id="code"
            bind:value={verificationCode}
            placeholder="123456"
            maxlength="6"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          on:click={verifyPhone}
          disabled={loading || !verificationCode}
          class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>
    {/if}
    
    <!-- ID Verification -->
    <div class="flex items-center justify-between p-4 border rounded-lg">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          {#if verificationStatus.id_verified}
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">ID Verification</p>
          <p class="text-sm text-gray-500">
            {#if verificationStatus.id_verified}
              Verified
            {:else if verificationStatus.id_verification}
              Status: {verificationStatus.id_verification.status}
            {:else}
              Upload a government-issued ID
            {/if}
          </p>
        </div>
      </div>
      
      {#if !verificationStatus.id_verified}
        <button
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          Upload ID
        </button>
      {/if}
    </div>
  </div>
</div>
