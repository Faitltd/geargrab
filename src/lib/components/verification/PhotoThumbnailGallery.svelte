<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import type { CapturedPhoto } from '$lib/services/camera';

  export let photos: CapturedPhoto[] = [];
  export let minPhotos: number = 3;
  export let maxPhotos: number = 10;
  export let disabled: boolean = false;
  export let showProgress: boolean = false;
  export let uploadProgress: number = 0;

  const dispatch = createEventDispatcher<{
    delete: { photoId: string; index: number };
    retake: { photoId: string; index: number };
    reorder: { fromIndex: number; toIndex: number };
    preview: { photo: CapturedPhoto; index: number };
  }>();

  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Handle photo deletion
  const handleDelete = (photoId: string, index: number) => {
    if (disabled) return;
    dispatch('delete', { photoId, index });
  };

  // Handle photo retake
  const handleRetake = (photoId: string, index: number) => {
    if (disabled) return;
    dispatch('retake', { photoId, index });
  };

  // Handle photo preview
  const handlePreview = (photo: CapturedPhoto, index: number) => {
    dispatch('preview', { photo, index });
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragEvent, index: number) => {
    if (disabled) return;
    draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (event: DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    event.preventDefault();
    dragOverIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = () => {
    dragOverIndex = null;
  };

  const handleDrop = (event: DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    event.preventDefault();
    
    if (draggedIndex !== index) {
      dispatch('reorder', { fromIndex: draggedIndex, toIndex: index });
    }
    
    draggedIndex = null;
    dragOverIndex = null;
  };

  const handleDragEnd = () => {
    draggedIndex = null;
    dragOverIndex = null;
  };

  // Check if minimum photos requirement is met
  $: hasMinPhotos = photos.length >= minPhotos;
  $: canAddMore = photos.length < maxPhotos;
  $: remainingPhotos = Math.max(0, minPhotos - photos.length);
</script>

<div class="space-y-4">
  <!-- Header with photo count and requirements -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <h3 class="text-lg font-semibold text-neutral-900">
        Condition Photos
      </h3>
      <span class="px-2 py-1 text-xs font-medium rounded-full {hasMinPhotos ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
        {photos.length} of {minPhotos} minimum
      </span>
    </div>
    
    {#if showProgress && uploadProgress > 0}
      <div class="flex items-center space-x-2">
        <div class="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div 
            class="h-full bg-primary-500 transition-all duration-300"
            style="width: {uploadProgress}%"
          ></div>
        </div>
        <span class="text-sm text-neutral-600">{Math.round(uploadProgress)}%</span>
      </div>
    {/if}
  </div>

  <!-- Requirements notice -->
  {#if !hasMinPhotos}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-start space-x-3">
        <svg class="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h4 class="text-sm font-medium text-yellow-800">
            {remainingPhotos} more {remainingPhotos === 1 ? 'photo' : 'photos'} required
          </h4>
          <p class="text-sm text-yellow-700 mt-1">
            Please capture at least {minPhotos} photos showing different angles and details of the gear.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Photo grid -->
  {#if photos.length > 0}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {#each photos as photo, index (photo.id)}
        <div
          class="relative group bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden transition-all duration-200 hover:shadow-md {dragOverIndex === index ? 'ring-2 ring-primary-500' : ''}"
          draggable={!disabled}
          on:dragstart={(e) => handleDragStart(e, index)}
          on:dragover={(e) => handleDragOver(e, index)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, index)}
          on:dragend={handleDragEnd}
          in:scale={{ duration: 200 }}
          out:fade={{ duration: 150 }}
        >
          <!-- Photo thumbnail -->
          <div class="aspect-square relative">
            <img
              src={photo.dataUrl}
              alt="Condition check photo {index + 1}"
              class="w-full h-full object-cover cursor-pointer"
              on:click={() => handlePreview(photo, index)}
              loading="lazy"
            />
            
            <!-- Photo index badge -->
            <div class="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
              {index + 1}
            </div>
            
            <!-- Action buttons overlay -->
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div class="flex space-x-2">
                <!-- Preview button -->
                <button
                  on:click={() => handlePreview(photo, index)}
                  class="p-2 bg-white/90 hover:bg-white text-neutral-700 rounded-full shadow-sm transition-colors"
                  title="Preview photo"
                  disabled={disabled}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                
                <!-- Retake button -->
                <button
                  on:click={() => handleRetake(photo.id, index)}
                  class="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition-colors"
                  title="Retake photo"
                  disabled={disabled}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                
                <!-- Delete button -->
                <button
                  on:click={() => handleDelete(photo.id, index)}
                  class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors"
                  title="Delete photo"
                  disabled={disabled}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Photo metadata -->
          <div class="p-3 space-y-1">
            <div class="flex items-center justify-between text-xs text-neutral-500">
              <span>{formatFileSize(photo.size)}</span>
              <span>{formatTimestamp(photo.timestamp)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty state -->
    <div class="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
      <svg class="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h3 class="text-lg font-medium text-neutral-900 mb-2">
        No photos captured yet
      </h3>
      <p class="text-neutral-600">
        Use the camera to capture at least {minPhotos} photos of the gear's condition.
      </p>
    </div>
  {/if}

  <!-- Photo tips -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h4 class="text-sm font-medium text-blue-800 mb-2">
          Photo Tips
        </h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• Capture different angles and close-up details</li>
          <li>• Ensure good lighting and clear focus</li>
          <li>• Include any existing damage or wear</li>
          <li>• Show serial numbers or identifying marks</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  /* Drag and drop visual feedback */
  [draggable="true"] {
    cursor: grab;
  }
  
  [draggable="true"]:active {
    cursor: grabbing;
  }
</style>
