<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  
  export let images: File[] = [];
  export let maxImages = 8;
  export let disabled = false;
  
  const dispatch = createEventDispatcher<{
    imagesChange: { images: File[] };
  }>();
  
  let fileInput: HTMLInputElement;
  let dragOver = false;
  let uploading = false;
  
  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      processFiles(Array.from(target.files));
    }
  };
  
  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    dragOver = false;
    
    if (disabled || !event.dataTransfer?.files) return;
    
    processFiles(Array.from(event.dataTransfer.files));
  };
  
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      dragOver = true;
    }
  };
  
  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragOver = false;
  };
  
  const processFiles = async (files: File[]) => {
    if (disabled) return;
    
    uploading = true;
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        console.warn(`File ${file.name} is not a supported image type`);
        continue;
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} is too large (max 5MB)`);
        continue;
      }
      
      // Check if we haven't exceeded max images
      if (images.length + validFiles.length >= maxImages) {
        console.warn(`Maximum ${maxImages} images allowed`);
        break;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      const newImages = [...images, ...validFiles];
      images = newImages;
      dispatch('imagesChange', { images: newImages });
    }
    
    uploading = false;
    
    // Reset file input
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const removeImage = (index: number) => {
    if (disabled) return;
    
    const newImages = images.filter((_, i) => i !== index);
    images = newImages;
    dispatch('imagesChange', { images: newImages });
  };
  
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (disabled || fromIndex === toIndex) return;
    
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    images = newImages;
    dispatch('imagesChange', { images: newImages });
  };
  
  const getImageUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };
</script>

<div class="space-y-4">
  <!-- Upload Area -->
  <div
    class="
      relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
      {dragOver 
        ? 'border-primary-500 bg-primary-50' 
        : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
      }
      {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    "
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:click={() => !disabled && fileInput?.click()}
    role="button"
    tabindex="0"
    aria-label="Upload images"
  >
    <input
      bind:this={fileInput}
      type="file"
      multiple
      accept={acceptedTypes.join(',')}
      on:change={handleFileSelect}
      disabled={disabled}
      class="hidden"
    />
    
    {#if uploading}
      <div class="flex flex-col items-center">
        <LoadingSpinner size="lg" color="primary" />
        <p class="mt-4 text-sm text-neutral-600">Processing images...</p>
      </div>
    {:else}
      <div class="flex flex-col items-center">
        <svg class="w-12 h-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <h3 class="text-lg font-medium text-neutral-900 mb-2">
          Upload Images
        </h3>
        
        <p class="text-sm text-neutral-600 mb-4">
          Drag and drop images here, or click to browse
        </p>
        
        <div class="text-xs text-neutral-500 space-y-1">
          <p>• Maximum {maxImages} images</p>
          <p>• JPG, PNG, WebP up to 5MB each</p>
          <p>• First image will be the main photo</p>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Image Preview Grid -->
  {#if images.length > 0}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {#each images as image, index}
        <div class="relative group">
          <div class="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(image)}
              alt="Preview {index + 1}"
              class="w-full h-full object-cover"
            />
          </div>
          
          <!-- Image Controls -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <!-- Move Left -->
              {#if index > 0}
                <button
                  type="button"
                  on:click={() => moveImage(index, index - 1)}
                  disabled={disabled}
                  class="p-2 bg-white text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  aria-label="Move left"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              {/if}
              
              <!-- Remove -->
              <button
                type="button"
                on:click={() => removeImage(index)}
                disabled={disabled}
                class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                aria-label="Remove image"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <!-- Move Right -->
              {#if index < images.length - 1}
                <button
                  type="button"
                  on:click={() => moveImage(index, index + 1)}
                  disabled={disabled}
                  class="p-2 bg-white text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  aria-label="Move right"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
          
          <!-- Main Photo Badge -->
          {#if index === 0}
            <div class="absolute top-2 left-2 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded">
              Main Photo
            </div>
          {/if}
          
          <!-- Image Number -->
          <div class="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-medium px-2 py-1 rounded">
            {index + 1}
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Upload Progress -->
    <div class="text-sm text-neutral-600">
      {images.length} of {maxImages} images uploaded
    </div>
  {/if}
</div>
