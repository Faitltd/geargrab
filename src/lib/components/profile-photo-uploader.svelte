<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notifications } from '$lib/stores/notifications';

  // Props
  export let currentPhotoURL: string = '';
  export let userName: string = '';
  export let size: 'small' | 'medium' | 'large' = 'medium';

  // Internal state
  let uploading = false;
  let dragActive = false;
  let fileInput: HTMLInputElement;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Size classes
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  }

  // Handle drag and drop
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      uploadPhoto(file);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
  }

  // Upload photo
  async function uploadPhoto(file: File) {
    // Validate file
    if (!file.type.startsWith('image/')) {
      notifications.add({
        type: 'error',
        message: 'Please select an image file',
        timeout: 5000
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notifications.add({
        type: 'error',
        message: 'Image must be less than 5MB',
        timeout: 5000
      });
      return;
    }

    uploading = true;

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photo');
      }

      const result = await response.json();

      notifications.add({
        type: 'success',
        message: 'Profile photo updated successfully!',
        timeout: 3000
      });

      // Dispatch success event
      dispatch('uploaded', { photoURL: result.photoURL });

    } catch (error) {
      console.error('Photo upload error:', error);
      notifications.add({
        type: 'error',
        message: error.message || 'Failed to upload photo',
        timeout: 5000
      });
    } finally {
      uploading = false;
    }
  }

  // Delete photo
  async function deletePhoto() {
    if (!confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }

    uploading = true;

    try {
      const response = await fetch('/api/profile/photo', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete photo');
      }

      notifications.add({
        type: 'success',
        message: 'Profile photo deleted successfully!',
        timeout: 3000
      });

      // Dispatch delete event
      dispatch('deleted');

    } catch (error) {
      console.error('Photo delete error:', error);
      notifications.add({
        type: 'error',
        message: error.message || 'Failed to delete photo',
        timeout: 5000
      });
    } finally {
      uploading = false;
    }
  }

  // Open file dialog
  function openFileDialog() {
    fileInput?.click();
  }

  // Get user initials for fallback
  function getUserInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<!-- Hidden file input -->
<input
  bind:this={fileInput}
  type="file"
  accept="image/*"
  on:change={handleFileSelect}
  class="hidden"
/>

<!-- Profile photo container -->
<div class="relative inline-block">
  <!-- Photo display -->
  <div 
    class="relative {sizeClasses[size]} rounded-full overflow-hidden border-4 border-white/20 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center cursor-pointer group transition-all duration-200 hover:border-green-400/50"
    class:border-green-400={dragActive}
    on:click={openFileDialog}
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    role="button"
    tabindex="0"
    aria-label="Upload profile photo"
  >
    {#if currentPhotoURL}
      <img 
        src={currentPhotoURL} 
        alt={userName}
        class="w-full h-full object-cover"
      />
    {:else}
      <span class="text-white font-bold text-lg">
        {getUserInitials(userName)}
      </span>
    {/if}

    <!-- Upload overlay -->
    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
      {#if uploading}
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      {:else}
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      {/if}
    </div>
  </div>

  <!-- Delete button (only show if there's a photo) -->
  {#if currentPhotoURL && !uploading}
    <button
      on:click|stopPropagation={deletePhoto}
      class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors duration-200 shadow-lg"
      aria-label="Delete profile photo"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>

<!-- Upload instructions -->
{#if size === 'large'}
  <div class="mt-4 text-center">
    <p class="text-sm text-gray-400 mb-2">
      Click to upload or drag and drop
    </p>
    <p class="text-xs text-gray-500">
      PNG, JPG, GIF up to 5MB
    </p>
  </div>
{/if}

<style>
  .group:hover .opacity-0 {
    opacity: 1;
  }
</style>
