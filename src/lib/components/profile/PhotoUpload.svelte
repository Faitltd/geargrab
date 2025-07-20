<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { uploadProfilePhoto, deleteProfilePhoto } from '$lib/services/users.service';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  export let currentPhotoURL: string | null = null;
  export let userId: string;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const dispatch = createEventDispatcher<{
    photoUpdated: { photoURL: string | null };
  }>();

  let uploading = false;
  let deleting = false;
  let fileInput: HTMLInputElement;
  let dragOver = false;

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 'w-6 h-6', text: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 'w-8 h-8', text: 'text-sm' },
    lg: { container: 'w-32 h-32', icon: 'w-12 h-12', text: 'text-base' }
  };

  $: config = sizeConfig[size];

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  async function handleFileUpload(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('error', 'Image must be smaller than 5MB');
      return;
    }

    try {
      uploading = true;
      
      // Upload the photo
      const photoURL = await uploadProfilePhoto(userId, file);
      
      // Dispatch the update event
      dispatch('photoUpdated', { photoURL });
      
      showToast('success', 'Profile photo updated successfully!');
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      showToast('error', error.message || 'Failed to upload photo');
    } finally {
      uploading = false;
      // Clear the file input
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  async function handleDeletePhoto() {
    if (!currentPhotoURL) return;

    try {
      deleting = true;
      
      // Delete the photo
      await deleteProfilePhoto(userId, currentPhotoURL);
      
      // Dispatch the update event
      dispatch('photoUpdated', { photoURL: null });
      
      showToast('success', 'Profile photo removed successfully!');
      
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      showToast('error', error.message || 'Failed to delete photo');
    } finally {
      deleting = false;
    }
  }

  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="relative">
  <!-- Photo Display/Upload Area -->
  <div
    class="relative {config.container} rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 cursor-pointer group {dragOver ? 'border-primary-500 bg-primary-50' : ''}"
    on:click={triggerFileInput}
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:keydown={(e) => e.key === 'Enter' && triggerFileInput()}
    role="button"
    tabindex="0"
  >
    {#if uploading}
      <!-- Loading State -->
      <div class="w-full h-full flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="sm" />
      </div>
    {:else if currentPhotoURL}
      <!-- Current Photo -->
      <img
        src={currentPhotoURL}
        alt="Profile"
        class="w-full h-full object-cover"
      />
      
      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg class="{config.icon} text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    {:else}
      <!-- Upload Placeholder -->
      <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 group-hover:bg-gray-200 transition-colors duration-200">
        <svg class="{config.icon} text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {#if size === 'lg'}
          <span class="{config.text} text-gray-500 text-center">Add Photo</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Delete Button -->
  {#if currentPhotoURL && !uploading}
    <button
      on:click|stopPropagation={handleDeletePhoto}
      disabled={deleting}
      class="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
      title="Remove photo"
    >
      {#if deleting}
        <LoadingSpinner size="xs" color="white" />
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {/if}
    </button>
  {/if}

  <!-- Hidden File Input -->
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    on:change={handleFileSelect}
    class="hidden"
  />
</div>

<!-- Upload Instructions -->
{#if size === 'lg'}
  <div class="mt-4 text-center">
    <p class="text-sm text-gray-600 mb-2">
      Click to upload or drag and drop
    </p>
    <p class="text-xs text-gray-500">
      PNG, JPG, GIF up to 5MB
    </p>
  </div>
{/if}

<!-- Drag Overlay -->
{#if dragOver}
  <div class="fixed inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
    <div class="bg-white rounded-lg p-8 shadow-xl">
      <div class="text-center">
        <svg class="w-16 h-16 text-primary-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-lg font-medium text-gray-900">Drop your photo here</p>
      </div>
    </div>
  </div>
{/if}
