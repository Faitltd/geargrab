<script lang="ts">
  import Checkbox from '$lib/components/ui/checkbox.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';

  let basicChecked = false;
  let termsChecked = false;
  let newsletterChecked = true;
  let notificationsChecked = false;
  let privacyChecked = false;

  let selectedOptions: string[] = [];

  function handleOptionChange(event: CustomEvent) {
    const { checked, value } = event.detail;
    if (checked) {
      selectedOptions = [...selectedOptions, value];
    } else {
      selectedOptions = selectedOptions.filter(option => option !== value);
    }
  }
</script>

<svelte:head>
  <title>Custom Checkboxes Test - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<VideoBackground
  videoSrc="/Milky Way.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity={0.4}
/>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Custom Checkbox Styling</h1>
      <p class="text-gray-300">Testing the new animated checkbox component with GearGrab's green theme</p>
    </div>

    <!-- Basic Examples -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4">Basic Examples</h2>
      <div class="space-y-4">
        <Checkbox
          bind:checked={basicChecked}
          label="Basic checkbox example"
        />
        
        <Checkbox
          bind:checked={termsChecked}
          label="I agree to the terms and conditions"
        />
        
        <Checkbox
          bind:checked={newsletterChecked}
          label="Subscribe to newsletter (pre-checked)"
        />
      </div>
    </div>

    <!-- Advanced Examples -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4">Advanced Examples</h2>
      <div class="space-y-4">
        <Checkbox
          bind:checked={notificationsChecked}
          labelClass="text-blue-300 text-lg font-medium"
        >
          <span class="text-blue-300 text-lg font-medium">
            Enable push notifications
            <span class="block text-sm text-gray-400 font-normal">Get notified about new gear and bookings</span>
          </span>
        </Checkbox>
        
        <Checkbox
          bind:checked={privacyChecked}
          wrapperClass="items-start"
        >
          <div class="text-gray-300">
            <p class="font-medium">Privacy Settings</p>
            <p class="text-sm text-gray-400 mt-1">
              I understand that my data will be processed according to the 
              <a href="#" class="text-green-400 hover:text-green-300 underline">Privacy Policy</a>
              and I consent to the collection and use of my information as described.
            </p>
          </div>
        </Checkbox>
      </div>
    </div>

    <!-- Multiple Choice Example -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4">Multiple Choice Example</h2>
      <p class="text-gray-300 mb-4">Select your interests:</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each ['Camping', 'Hiking', 'Cycling', 'Photography', 'Climbing', 'Water Sports'] as option}
          <Checkbox
            checked={selectedOptions.includes(option)}
            label={option}
            value={option}
            on:change={handleOptionChange}
          />
        {/each}
      </div>
      {#if selectedOptions.length > 0}
        <div class="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
          <p class="text-green-200 text-sm">
            Selected: {selectedOptions.join(', ')}
          </p>
        </div>
      {/if}
    </div>

    <!-- Form Example -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4">Form Integration Example</h2>
      <form class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Message</label>
          <textarea
            placeholder="Your message..."
            rows="3"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          ></textarea>
        </div>
        
        <div class="space-y-3">
          <Checkbox
            bind:checked={termsChecked}
            label="I agree to the terms of service"
            required
          />
          
          <Checkbox
            bind:checked={newsletterChecked}
            label="Send me updates and promotions"
          />
        </div>
        
        <button
          type="submit"
          disabled={!termsChecked}
          class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Submit Form
        </button>
      </form>
    </div>

    <!-- Status Display -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-xl font-bold text-white mb-4">Current State</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 class="font-medium text-gray-300 mb-2">Checkbox States:</h3>
          <ul class="space-y-1 text-gray-400">
            <li>Basic: {basicChecked ? '✅' : '❌'}</li>
            <li>Terms: {termsChecked ? '✅' : '❌'}</li>
            <li>Newsletter: {newsletterChecked ? '✅' : '❌'}</li>
            <li>Notifications: {notificationsChecked ? '✅' : '❌'}</li>
            <li>Privacy: {privacyChecked ? '✅' : '❌'}</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium text-gray-300 mb-2">Selected Options:</h3>
          <p class="text-gray-400">
            {selectedOptions.length > 0 ? selectedOptions.join(', ') : 'None selected'}
          </p>
        </div>
      </div>
    </div>

  </div>
</div>
