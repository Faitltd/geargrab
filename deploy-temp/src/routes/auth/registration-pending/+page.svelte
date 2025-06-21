<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let timeElapsed = 0;
  
  onMount(() => {
    // Update elapsed time every second
    const interval = setInterval(() => {
      timeElapsed++;
    }, 1000);
    
    return () => clearInterval(interval);
  });
  
  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
</script>

<svelte:head>
  <title>Registration Pending - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover" />
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-30 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
  <div class="max-w-2xl w-full space-y-8">
    
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 text-center">
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-6">
        <svg class="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h1 class="text-3xl font-extrabold text-white mb-4">
        Registration Submitted Successfully!
      </h1>
      
      <p class="text-lg text-gray-300 mb-6">
        Your background check is now in progress. We'll notify you as soon as it's complete.
      </p>
      
      <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p class="text-sm text-blue-200">
          <strong>Time elapsed:</strong> {formatTime(timeElapsed)}
        </p>
      </div>
    </div>
    
    <!-- Status Timeline -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-xl font-semibold text-white mb-6">Background Check Process</h2>
      
      <div class="space-y-6">
        <!-- Step 1: Submitted -->
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-full bg-green-500">
              <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-white">Application Submitted</h3>
            <p class="text-sm text-gray-300">Your registration and consent have been received.</p>
            <p class="text-xs text-green-400 mt-1">✓ Completed</p>
          </div>
        </div>
        
        <!-- Step 2: Processing -->
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-500">
              <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-white">Background Check in Progress</h3>
            <p class="text-sm text-gray-300">Checkr is processing your background check.</p>
            <p class="text-xs text-yellow-400 mt-1">⏳ In Progress</p>
          </div>
        </div>
        
        <!-- Step 3: Review -->
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-full bg-gray-500">
              <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-white">Review & Approval</h3>
            <p class="text-sm text-gray-300">GearGrab will review the results and make a decision.</p>
            <p class="text-xs text-gray-400 mt-1">⏸ Pending</p>
          </div>
        </div>
        
        <!-- Step 4: Account Creation -->
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-full bg-gray-500">
              <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-white">Account Activation</h3>
            <p class="text-sm text-gray-300">Your GearGrab account will be activated and you can start using the platform.</p>
            <p class="text-xs text-gray-400 mt-1">⏸ Pending</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- What to Expect -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-xl font-semibold text-white mb-4">What to Expect</h2>
      
      <div class="space-y-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-green-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-white">Email Notifications</h3>
            <p class="text-sm text-gray-300">
              You'll receive email updates at each stage of the process. Check your inbox regularly.
            </p>
          </div>
        </div>
        
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-green-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-white">Processing Time</h3>
            <p class="text-sm text-gray-300">
              Most background checks complete within 24-48 hours. Complex cases may take up to 5 business days.
            </p>
          </div>
        </div>
        
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-green-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-white">Need Help?</h3>
            <p class="text-sm text-gray-300">
              If you have questions about your background check, contact us at 
              <a href="mailto:support@geargrab.co" class="text-green-400 hover:text-green-300">support@geargrab.co</a>
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-center">
      <h2 class="text-lg font-semibold text-white mb-4">While You Wait</h2>
      
      <div class="space-y-4">
        <button
          type="button"
          class="w-full flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          on:click={() => goto('/')}
        >
          Browse Available Gear
        </button>
        
        <button
          type="button"
          class="w-full flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          on:click={() => goto('/how-it-works')}
        >
          Learn How GearGrab Works
        </button>
        
        <p class="text-xs text-gray-400 mt-4">
          You can close this page safely. We'll email you when your background check is complete.
        </p>
      </div>
    </div>
  </div>
</div>
