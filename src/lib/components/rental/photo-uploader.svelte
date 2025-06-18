<!--
  Photo Uploader for Rental Documentation
  Specialized component for uploading photos during rental handoffs
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Booking } from '$lib/types/firestore';
  
  // Props
  export let booking: Booking;
  export let phase: 'pre' | 'post';
  export let userRole: 'owner' | 'renter';
  export let uploading: boolean = false;
  
  // Internal state
  let dragActive = false;
  let fileInput: HTMLInputElement;
  let selectedPhotoType = 'condition';
  let photoDescription = '';
  let uploadProgress = 0;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Photo type options
  const photoTypes = [
    { value: 'condition', label: 'Overall Condition', description: 'General condition of the gear' },
    { value: 'serial_number', label: 'Serial Number', description: 'Serial numbers or identifying marks' },
    { value: 'accessories', label: 'Accessories', description: 'Included accessories and parts' },
    { value: 'damage', label: 'Damage/Issues', description: 'Any existing damage or issues' },
    { value: 'general', label: 'General', description: 'Other documentation photos' }
  ];
  
  // Handle file selection
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    await uploadPhoto(input.files[0]);
    input.value = ''; // Reset input
  }
  
  // Handle drag and drop
  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = true;
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = false;
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      uploadPhoto(files[0]);
    }
  }
  
  // Upload photo
  async function uploadPhoto(file: File) {
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB.');
      return;
    }
    
    uploading = true;
    uploadProgress = 0;
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('photoType', selectedPhotoType);
      formData.append('rentalPhase', phase);
      formData.append('description', photoDescription.trim());
      
      const response = await fetch(`/api/bookings/${booking.id}/photos`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photo');
      }
      
      const result = await response.json();
      
      // Reset form
      photoDescription = '';
      selectedPhotoType = 'condition';
      
      // Dispatch success event
      dispatch('uploaded', { photo: result.photo });
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(`Failed to upload photo: ${error.message}`);
    } finally {
      uploading = false;
      uploadProgress = 0;
    }
  }
  
  function openFileDialog() {
    fileInput?.click();
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFileDialog();
    }
  }
</script>

<div class="space-y-4">
  <!-- Photo Type Selection -->
  <div>
    <label class="block text-sm font-medium text-white mb-2">
      Photo Type *
    </label>
    <select
      bind:value={selectedPhotoType}
      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
    >
      {#each photoTypes as type}
        <option value={type.value} class="bg-gray-800 text-white">
          {type.label}
        </option>
      {/each}
    </select>
    <p class="text-xs text-gray-400 mt-1">
      {photoTypes.find(t => t.value === selectedPhotoType)?.description}
    </p>
  </div>

  <!-- Photo Description -->
  <div>
    <label class="block text-sm font-medium text-white mb-2">
      Description (Optional)
    </label>
    <input
      type="text"
      bind:value={photoDescription}
      placeholder="Add a description for this photo..."
      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
    />
  </div>

  <!-- Upload Area -->
  <div
    class="upload-area {dragActive ? 'active' : ''} {uploading ? 'uploading' : ''}"
    on:dragenter={handleDragEnter}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={openFileDialog}
    on:keydown={handleKeydown}
    tabindex="0"
    role="button"
    aria-disabled={uploading}
  >
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      on:change={handleFileSelect}
      disabled={uploading}
      class="hidden"
    />
    
    <div class="upload-content">
      {#if uploading}
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
          <p class="text-white font-medium">Uploading photo...</p>
          <p class="text-gray-300 text-sm">Please wait while we process your image</p>
        </div>
      {:else}
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <p class="text-white font-medium mb-1">Upload Photo</p>
          <p class="text-gray-300 text-sm mb-2">Drag and drop or click to select</p>
          <p class="text-gray-400 text-xs">JPEG, PNG, WebP up to 10MB</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Upload Guidelines -->
  <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
    <h4 class="text-sm font-medium text-blue-300 mb-2">📸 Photo Guidelines</h4>
    <ul class="text-xs text-blue-200 space-y-1">
      <li>• Take clear, well-lit photos from multiple angles</li>
      <li>• Include close-ups of any existing damage or wear</li>
      <li>• Capture serial numbers and identifying marks</li>
      <li>• Document all included accessories and parts</li>
      <li>• Ensure photos are in focus and properly oriented</li>
    </ul>
  </div>
</div>


