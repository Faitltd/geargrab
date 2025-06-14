<script lang="ts">
  import { onMount } from 'svelte';
  import { verificationService, VERIFICATION_REQUIREMENTS, type UserVerificationStatus } from '$lib/services/verification';
  import { backgroundCheckService } from '$lib/services/backgroundCheck';
  import { authStore } from '$lib/stores/auth';
  import BackgroundCheckFlow from '$lib/components/verification/background-check-flow.svelte';
  import BackgroundCheckStatus from '$lib/components/verification/background-check-status.svelte';

  let verificationStatus: UserVerificationStatus | null = null;
  let loading = true;
  let activeStep = 'overview';
  let phoneNumber = '';
  let verificationCode = '';
  let email = '';
  let showBackgroundCheckDetails = false;

  onMount(async () => {
    if ($authStore.user) {
      try {
        verificationStatus = await verificationService.getUserVerificationStatus($authStore.user.uid);
      } catch (error) {
        console.error('Error loading verification status:', error);
      }
    }
    loading = false;
  });

  async function startEmailVerification() {
    if (!$authStore.user || !email) return;
    
    try {
      await verificationService.verifyEmail($authStore.user.uid, email);
      alert('Verification email sent! Check your inbox.');
    } catch (error) {
      console.error('Error starting email verification:', error);
    }
  }

  async function startPhoneVerification() {
    if (!$authStore.user || !phoneNumber) return;

    try {
      const result = await verificationService.verifyPhone($authStore.user.uid, phoneNumber);
      if (result.success) {
        alert('Verification code sent via SMS!');
        activeStep = 'phone-confirm';
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error starting phone verification:', error);
      alert('Failed to send verification code. Please try again.');
    }
  }

  function getVerificationLevelColor(level: string) {
    switch (level) {
      case 'none': return 'text-gray-400';
      case 'basic': return 'text-blue-400';
      case 'standard': return 'text-green-400';
      case 'premium': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  }

  function getVerificationLevelBg(level: string) {
    switch (level) {
      case 'none': return 'bg-gray-500';
      case 'basic': return 'bg-blue-500';
      case 'standard': return 'bg-green-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }

  async function confirmPhoneVerification() {
    if (!$authStore.user || !verificationCode) return;

    try {
      const result = await verificationService.confirmPhoneVerification($authStore.user.uid, verificationCode);
      if (result.success) {
        alert('Phone verified successfully!');
        activeStep = 'overview';
        // Reload verification status
        verificationStatus = await verificationService.getUserVerificationStatus($authStore.user.uid);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error confirming phone verification:', error);
      alert('Failed to verify code. Please try again.');
    }
  }

  // Handle background check submission
  function handleBackgroundCheckSubmitted(event: CustomEvent) {
    const { requestId, provider, checkType } = event.detail;
    console.log('Background check submitted:', { requestId, provider, checkType });

    // Reload verification status
    if ($authStore.user) {
      verificationService.getUserVerificationStatus($authStore.user.uid).then(status => {
        verificationStatus = status;
      });
    }

    // Switch back to overview
    activeStep = 'overview';
  }

  // Check if background check is required for current verification level
  function isBackgroundCheckRequired(level: 'basic' | 'standard' | 'premium'): boolean {
    return backgroundCheckService.isRequiredForLevel(level);
  }
</script>

<svelte:head>
  <title>Account Verification - GearGrab</title>
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
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
          <div class="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-white mt-4">Loading verification status...</p>
        </div>
      </div>
    {:else}
      
      <!-- Header -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <h1 class="text-2xl font-bold text-white mb-2">Account Verification</h1>
        <p class="text-gray-300">Verify your account to build trust and unlock features</p>
      </div>

      {#if verificationStatus}
        <!-- Current Status -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-white">Verification Status</h2>
              <p class="text-gray-300">Your current verification level and progress</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold {getVerificationLevelColor(verificationStatus.verificationLevel)} capitalize">
                {verificationStatus.verificationLevel}
              </div>
              <div class="text-sm text-gray-300">
                {verificationStatus.verificationScore}/100 points
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="flex justify-between text-sm text-gray-300 mb-2">
              <span>Verification Progress</span>
              <span>{verificationStatus.verificationScore}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div 
                class="h-2 rounded-full {getVerificationLevelBg(verificationStatus.verificationLevel)}"
                style="width: {verificationStatus.verificationScore}%"
              ></div>
            </div>
          </div>

          <!-- Verification Methods -->
          <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
            {#each Object.entries(verificationStatus.verifiedMethods) as [method, verified]}
              <div class="text-center">
                <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center {verified ? 'bg-green-500' : 'bg-gray-600'}">
                  {#if method === 'email'}
                    📧
                  {:else if method === 'phone'}
                    📱
                  {:else if method === 'identity'}
                    🆔
                  {:else if method === 'payment'}
                    💳
                  {:else if method === 'address'}
                    🏠
                  {:else if method === 'background_check'}
                    🛡️
                  {/if}
                </div>
                <div class="text-xs text-gray-300 capitalize">{method.replace('_', ' ')}</div>
                <div class="text-xs {verified ? 'text-green-400' : 'text-gray-500'}">
                  {verified ? 'Verified' : 'Pending'}
                </div>
              </div>
            {/each}
          </div>

          <!-- Badges -->
          {#if verificationStatus.badges.length > 0}
            <div class="mt-6 pt-6 border-t border-white/20">
              <h3 class="text-sm font-medium text-white mb-3">Your Badges</h3>
              <div class="flex flex-wrap gap-2">
                {#each verificationStatus.badges as badge}
                  <div class="bg-white/10 rounded-full px-3 py-1 text-xs text-white flex items-center space-x-1">
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Verification Steps -->
        {#if activeStep === 'overview'}
          <div class="space-y-6">
            
            <!-- Basic Verification -->
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white">Basic Verification</h3>
                <span class="text-sm text-blue-400">Required</span>
              </div>
              <div class="space-y-4">
                {#each VERIFICATION_REQUIREMENTS.basic as requirement}
                  <div class="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 class="font-medium text-white">{requirement.name}</h4>
                      <p class="text-sm text-gray-300">{requirement.description}</p>
                      <div class="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>⏱️ {requirement.estimatedTime}</span>
                        <span>✨ {requirement.benefits.join(', ')}</span>
                      </div>
                    </div>
                    <div>
                      {#if requirement.type === 'email'}
                        {#if verificationStatus.verifiedMethods.email}
                          <span class="text-green-400">✅ Verified</span>
                        {:else}
                          <button 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                            on:click={() => activeStep = 'email'}
                          >
                            Verify Email
                          </button>
                        {/if}
                      {:else if requirement.type === 'phone'}
                        {#if verificationStatus.verifiedMethods.phone}
                          <span class="text-green-400">✅ Verified</span>
                        {:else}
                          <button 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                            on:click={() => activeStep = 'phone'}
                          >
                            Verify Phone
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Standard Verification -->
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white">Standard Verification</h3>
                <span class="text-sm text-green-400">Recommended</span>
              </div>
              <div class="space-y-4">
                {#each VERIFICATION_REQUIREMENTS.standard as requirement}
                  <div class="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 class="font-medium text-white">{requirement.name}</h4>
                      <p class="text-sm text-gray-300">{requirement.description}</p>
                      <div class="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>⏱️ {requirement.estimatedTime}</span>
                        <span>✨ {requirement.benefits.join(', ')}</span>
                      </div>
                    </div>
                    <div>
                      {#if requirement.type === 'identity'}
                        {#if verificationStatus.verifiedMethods.identity}
                          <span class="text-green-400">✅ Verified</span>
                        {:else}
                          <button 
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                            on:click={() => activeStep = 'identity'}
                          >
                            Upload ID
                          </button>
                        {/if}
                      {:else if requirement.type === 'payment'}
                        {#if verificationStatus.verifiedMethods.payment}
                          <span class="text-green-400">✅ Verified</span>
                        {:else}
                          <button 
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                            on:click={() => activeStep = 'payment'}
                          >
                            Verify Payment
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Premium Verification -->
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white">Premium Verification</h3>
                <span class="text-sm text-purple-400">Premium</span>
              </div>
              <div class="space-y-4">
                {#each VERIFICATION_REQUIREMENTS.premium as requirement}
                  <div class="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 class="font-medium text-white">{requirement.name}</h4>
                      <p class="text-sm text-gray-300">{requirement.description}</p>
                      <div class="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>⏱️ {requirement.estimatedTime}</span>
                        <span>✨ {requirement.benefits.join(', ')}</span>
                      </div>
                    </div>
                    <div>
                      {#if requirement.type === 'address'}
                        {#if verificationStatus.verifiedMethods.address}
                          <span class="text-green-400">✅ Verified</span>
                        {:else}
                          <button
                            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                            on:click={() => activeStep = 'address'}
                          >
                            Verify Address
                          </button>
                        {/if}
                      {:else if requirement.type === 'background_check'}
                        {#if verificationStatus.verifiedMethods.background_check}
                          <div class="text-center">
                            <span class="text-green-400 block">✅ Verified</span>
                            <button
                              class="text-xs text-purple-400 hover:text-purple-300 mt-1"
                              on:click={() => showBackgroundCheckDetails = !showBackgroundCheckDetails}
                            >
                              View Details
                            </button>
                          </div>
                        {:else}
                          <button
                            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                            on:click={() => activeStep = 'background_check'}
                          >
                            Start Background Check
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Background Check Status (if verified) -->
            {#if verificationStatus.verifiedMethods.background_check && showBackgroundCheckDetails}
              <BackgroundCheckStatus showDetails={showBackgroundCheckDetails} />
            {/if}

          </div>

        <!-- Email Verification Step -->
        {:else if activeStep === 'email'}
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 class="text-xl font-semibold text-white mb-6">Email Verification</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  bind:value={email}
                  placeholder="your@email.com"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="flex space-x-4">
                <button 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  on:click={startEmailVerification}
                  disabled={!email}
                >
                  Send Verification Email
                </button>
                <button 
                  class="text-gray-300 hover:text-white px-6 py-2"
                  on:click={() => activeStep = 'overview'}
                >
                  Back
                </button>
              </div>
            </div>
          </div>

        <!-- Phone Verification Step -->
        {:else if activeStep === 'phone'}
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 class="text-xl font-semibold text-white mb-6">Phone Verification</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  bind:value={phoneNumber}
                  placeholder="+1 (555) 123-4567"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="flex space-x-4">
                <button 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  on:click={startPhoneVerification}
                  disabled={!phoneNumber}
                >
                  Send SMS Code
                </button>
                <button 
                  class="text-gray-300 hover:text-white px-6 py-2"
                  on:click={() => activeStep = 'overview'}
                >
                  Back
                </button>
              </div>
            </div>
          </div>

        <!-- Phone Confirmation Step -->
        {:else if activeStep === 'phone-confirm'}
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 class="text-xl font-semibold text-white mb-6">Enter Verification Code</h2>
            <p class="text-gray-300 mb-4">We sent a 6-digit code to {phoneNumber}</p>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                <input
                  type="text"
                  bind:value={verificationCode}
                  placeholder="123456"
                  maxlength="6"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="flex space-x-4">
                <button
                  class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                  disabled={verificationCode.length !== 6}
                  on:click={confirmPhoneVerification}
                >
                  Verify Code
                </button>
                <button
                  class="text-blue-400 hover:text-blue-300 px-6 py-2"
                  on:click={startPhoneVerification}
                >
                  Resend Code
                </button>
                <button
                  class="text-gray-300 hover:text-white px-6 py-2"
                  on:click={() => activeStep = 'overview'}
                >
                  Back
                </button>
              </div>
            </div>
          </div>

        <!-- Background Check Step -->
        {:else if activeStep === 'background_check'}
          <BackgroundCheckFlow on:submitted={handleBackgroundCheckSubmitted} />
        {/if}

      {/if}

    {/if}

  </div>
</div>
