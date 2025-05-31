<!--
  Image Uploader Component
  Props:
  - images: Array of image URLs or File objects
  - maxImages: Maximum number of images allowed (default: 5)
  - onChange: Function to call when images change
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let images: string[] = [];
  export let maxImages: number = 5;
  
  // Internal state
  let dragActive = false;
  let fileInput: HTMLInputElement;
  let imageErrors: string[] = [];
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Handle file selection from input
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    processFiles(Array.from(input.files));
    input.value = ''; // Reset input to allow selecting the same file again
  }
  
  // Handle drag events
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
    
    if (!event.dataTransfer) return;
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFiles(Array.from(event.dataTransfer.files));
    }
  }
  
  // Process files
  function processFiles(files: File[]) {
    imageErrors = [];
    
    // Check if adding these files would exceed the maximum
    if (images.length + files.length > maxImages) {
      imageErrors.push(`You can only upload a maximum of ${maxImages} images.`);
      files = files.slice(0, maxImages - images.length);
    }
    
    // Validate and create URLs for preview
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        imageErrors.push(`${file.name} is not an image file.`);
        return false;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        imageErrors.push(`${file.name} exceeds the 5MB size limit.`);
        return false;
      }
      
      return true;
    });
    
    // Create object URLs for valid files
    const newImages = validFiles.map(file => URL.createObjectURL(file));
    
    // Update images array
    const updatedImages = [...images, ...newImages];
    dispatch('change', { images: updatedImages });
  }
  
  // Remove image
  function removeImage(index: number) {
    const updatedImages = images.filter((_, i) => i !== index);
    dispatch('change', { images: updatedImages });
  }
  
  // Move image up in order
  function moveImageUp(index: number) {
    if (index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      dispatch('change', { images: newImages });
    }
  }

  // Move image down in order
  function moveImageDown(index: number) {
    if (index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      dispatch('change', { images: newImages });
    }
  }
  
  // Trigger file input click
  function openFileDialog() {
    if (fileInput) {
      fileInput.click();
    }
  }

  // Handle keyboard events for accessibility
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFileDialog();
    }
  }
</script>

<div class="image-uploader">
  <!-- Error messages -->
  {#if imageErrors.length > 0}
    <div class="error-container mb-2">
      {#each imageErrors as error}
        <p class="text-red-500 text-sm">{error}</p>
      {/each}
    </div>
  {/if}
  
  <!-- Drag and drop area -->
  <div
    class="upload-area {dragActive ? 'active' : ''} {images.length >= maxImages ? 'disabled' : ''}"
    on:dragenter={handleDragEnter}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={openFileDialog}
    on:keydown={handleKeydown}
    tabindex="0"
    role="button"
    aria-disabled={images.length >= maxImages}
    aria-label="Upload images by clicking or dragging files here"
  >
    <input 
      type="file" 
      bind:this={fileInput}
      on:change={handleFileSelect}
      accept="image/*"
      multiple
      class="hidden"
      aria-label="Upload images"
      disabled={images.length >= maxImages}
    />
    
    <div class="upload-content">
      <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      
      <p class="upload-text">
        {#if images.length >= maxImages}
          Maximum number of images reached
        {:else}
          Drag & drop images here or click to browse
        {/if}
      </p>
      
      <p class="upload-hint">
        {images.length} of {maxImages} images uploaded
      </p>
    </div>
  </div>
  
  <!-- Image previews -->
  {#if images.length > 0}
    <div class="image-preview-container">
      <p class="text-sm font-medium text-gray-700 mb-2">
        Use the arrow buttons to reorder images. The first image will be the main image.
      </p>

      <div class="image-grid">
        {#each images as image, i (image)}
          <div class="image-item">
            <div class="image-wrapper">
              <img src={image} alt={`Preview ${i+1}`} class="preview-image" />

              <!-- Remove button -->
              <button
                type="button"
                class="remove-button"
                on:click={() => removeImage(i)}
                aria-label={`Remove image ${i+1}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>

              <!-- Move buttons -->
              <div class="move-buttons">
                {#if i > 0}
                  <button
                    type="button"
                    class="move-button"
                    on:click={() => moveImageUp(i)}
                    aria-label={`Move image ${i+1} left`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                {/if}
                {#if i < images.length - 1}
                  <button
                    type="button"
                    class="move-button"
                    on:click={() => moveImageDown(i)}
                    aria-label={`Move image ${i+1} right`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                {/if}
              </div>

              {#if i === 0}
                <div class="main-image-badge">
                  Main Image
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .image-uploader {
    width: 100%;
  }
  
  .upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .upload-area:hover {
    border-color: #9ca3af;
  }
  
  .upload-area.active {
    border-color: #10b981;
    background-color: rgba(16, 185, 129, 0.05);
  }
  
  .upload-area.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .upload-icon {
    width: 3rem;
    height: 3rem;
    color: #9ca3af;
    margin: 0 auto 1rem;
  }
  
  .upload-text {
    font-size: 1rem;
    font-weight: 500;
    color: #4b5563;
    margin-bottom: 0.5rem;
  }
  
  .upload-hint {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .hidden {
    display: none;
  }
  
  .image-preview-container {
    margin-top: 1.5rem;
  }
  
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .image-item {
    position: relative;
  }
  
  .image-wrapper {
    position: relative;
    aspect-ratio: 1;
    border-radius: 0.375rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .remove-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: rgba(239, 68, 68, 0.9);
    color: white;
    border-radius: 9999px;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .remove-button:hover {
    background-color: rgb(220, 38, 38);
  }
  
  .main-image-badge {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    background-color: rgba(16, 185, 129, 0.9);
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  
  .move-buttons {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
  }

  .move-button {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 0.25rem;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
  }

  .move-button:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
</style>
