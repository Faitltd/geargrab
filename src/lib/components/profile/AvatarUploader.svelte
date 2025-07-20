<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';

  export let currentAvatar: string | undefined = undefined;
  export let userName: string;
  export let size: 'sm' | 'md' | 'lg' = 'lg';

  const dispatch = createEventDispatcher<{
    upload: { file: File };
  }>();

  // State
  let fileInput: HTMLInputElement;
  let isUploading = false;
  let previewUrl: string | null = null;
  let selectedFile: File | null = null;
  let dragOver = false;

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-16 h-16', text: 'text-sm' },
    md: { container: 'w-24 h-24', text: 'text-base' },
    lg: { container: 'w-32 h-32', text: 'text-lg' }
  };

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      processFile(file);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function processFile(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be less than 5MB');
      return;
    }

    selectedFile = file;
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function triggerFileInput() {
    fileInput.click();
  }

  async function handleUpload() {
    if (!selectedFile) return;

    try {
      isUploading = true;
      dispatch('upload', { file: selectedFile });
      
      // Reset state after successful upload
      selectedFile = null;
      previewUrl = null;
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      isUploading = false;
    }
  }

  function cancelUpload() {
    selectedFile = null;
    previewUrl = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<div class="flex items-start space-x-6">
  <!-- Current/Preview Avatar -->
  <div class="flex-shrink-0">
    <div class="{sizeConfig[size].container} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
      {#if previewUrl}
        <img
          src={previewUrl}
          alt="Preview"
          class="w-full h-full object-cover"
        />
      {:else if currentAvatar}
        <img
          src={currentAvatar}
          alt={userName}
          class="w-full h-full object-cover"
        />
      {:else}
        <div class="w-full h-full flex items-center justify-center bg-blue-100">
          <span class="{sizeConfig[size].text} font-semibold text-blue-600">
            {getInitials(userName)}
          </span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Upload Controls -->
  <div class="flex-1">
    <h3 class="text-sm font-medium text-gray-900 mb-2">Profile Photo</h3>
    
    {#if selectedFile}
      <!-- Preview Mode -->
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          Selected: {selectedFile.name}
        </p>
        
        <div class="flex space-x-3">
          <Button
            variant="primary"
            size="sm"
            on:click={handleUpload}
            loading={isUploading}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            on:click={cancelUpload}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </div>
    {:else}
      <!-- Upload Mode -->
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          Upload a new profile photo. JPG, PNG or GIF up to 5MB.
        </p>

        <!-- Drag and Drop Area -->
        <div
          class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors {dragOver ? 'border-blue-500 bg-blue-50' : ''}"
          on:drop={handleDrop}
          on:dragover={handleDragOver}
          on:dragleave={handleDragLeave}
          role="button"
          tabindex="0"
          on:click={triggerFileInput}
          on:keydown={(e) => e.key === 'Enter' && triggerFileInput()}
        >
          <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p class="text-sm text-gray-600">
            <span class="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
              Click to upload
            </span>
            or drag and drop
          </p>
        </div>

        <!-- File Input -->
        <input
          bind:this={fileInput}
          type="file"
          accept="image/*"
          on:change={handleFileSelect}
          class="hidden"
        />

        <!-- Upload Button -->
        <Button
          variant="outline"
          size="sm"
          on:click={triggerFileInput}
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Choose File
        </Button>
      </div>
    {/if}

    <!-- Guidelines -->
    <div class="mt-4 text-xs text-gray-500">
      <p>• Recommended size: 400x400 pixels</p>
      <p>• Supported formats: JPG, PNG, GIF</p>
      <p>• Maximum file size: 5MB</p>
    </div>
  </div>
</div>
