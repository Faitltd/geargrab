<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ConditionCheckPhoto } from '$lib/services/conditionCheck';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  // Props
  export let photos: ConditionCheckPhoto[] = [];
  export let title = 'Condition Photos';
  export let showTimestamp = true;
  export let showMetadata = false;
  export let allowDownload = true;
  export let columns = 'auto'; // 'auto', 2, 3, 4, etc.

  // State
  let selectedPhotoIndex = -1;
  let showLightbox = false;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    photoClick: { photo: ConditionCheckPhoto; index: number };
    download: { photo: ConditionCheckPhoto };
  }>();

  // Reactive statements
  $: gridCols = getGridColumns(columns, photos.length);
  $: selectedPhoto = selectedPhotoIndex >= 0 ? photos[selectedPhotoIndex] : null;

  function getGridColumns(cols: string | number, photoCount: number): string {
    if (cols === 'auto') {
      if (photoCount === 1) return 'grid-cols-1';
      if (photoCount === 2) return 'grid-cols-1 md:grid-cols-2';
      if (photoCount <= 4) return 'grid-cols-2 md:grid-cols-2';
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
    return `grid-cols-${cols}`;
  }

  function openLightbox(index: number) {
    selectedPhotoIndex = index;
    showLightbox = true;
    dispatch('photoClick', { photo: photos[index], index });
  }

  function closeLightbox() {
    showLightbox = false;
    selectedPhotoIndex = -1;
  }

  function previousPhoto() {
    if (selectedPhotoIndex > 0) {
      selectedPhotoIndex--;
    }
  }

  function nextPhoto() {
    if (selectedPhotoIndex < photos.length - 1) {
      selectedPhotoIndex++;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!showLightbox) return;
    
    switch (event.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        previousPhoto();
        break;
      case 'ArrowRight':
        nextPhoto();
        break;
    }
  }

  function downloadPhoto(photo: ConditionCheckPhoto) {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.filename || `condition-photo-${photo.id}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    dispatch('download', { photo });
  }

  function formatTimestamp(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="space-y-4">
  <!-- Header -->
  {#if title}
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
      <span class="text-sm text-gray-500">
        {photos.length} photo{photos.length !== 1 ? 's' : ''}
      </span>
    </div>
  {/if}

  <!-- Photos Grid -->
  {#if photos.length > 0}
    <div class="grid {gridCols} gap-4">
      {#each photos as photo, index}
        <div class="relative group cursor-pointer" on:click={() => openLightbox(index)}>
          <!-- Photo -->
          <div class="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img
              src={photo.url}
              alt="Condition photo {index + 1}"
              class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          <!-- Overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>

          <!-- Photo Number -->
          <div class="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {index + 1}
          </div>

          <!-- Download Button -->
          {#if allowDownload}
            <button
              on:click|stopPropagation={() => downloadPhoto(photo)}
              class="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
              title="Download photo"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          {/if}

          <!-- Timestamp -->
          {#if showTimestamp && photo.uploadedAt}
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {formatTimestamp(photo.uploadedAt)}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No photos uploaded</h3>
      <p class="text-gray-500">Condition photos will appear here once uploaded.</p>
    </div>
  {/if}
</div>

<!-- Lightbox Modal -->
{#if showLightbox && selectedPhoto}
  <Modal
    isOpen={showLightbox}
    size="full"
    closable={true}
    backdrop={true}
    on:close={closeLightbox}
  >
    <div class="relative h-full flex items-center justify-center bg-black">
      <!-- Photo -->
      <img
        src={selectedPhoto.url}
        alt="Condition photo {selectedPhotoIndex + 1}"
        class="max-w-full max-h-full object-contain"
      />

      <!-- Navigation -->
      {#if photos.length > 1}
        <!-- Previous Button -->
        <button
          on:click={previousPhoto}
          disabled={selectedPhotoIndex === 0}
          class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Next Button -->
        <button
          on:click={nextPhoto}
          disabled={selectedPhotoIndex === photos.length - 1}
          class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      {/if}

      <!-- Close Button -->
      <button
        on:click={closeLightbox}
        class="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Photo Info -->
      <div class="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg max-w-sm">
        <div class="text-sm space-y-1">
          <div class="font-medium">
            Photo {selectedPhotoIndex + 1} of {photos.length}
          </div>
          {#if showTimestamp && selectedPhoto.uploadedAt}
            <div class="text-gray-300">
              {formatTimestamp(selectedPhoto.uploadedAt)}
            </div>
          {/if}
          {#if showMetadata}
            <div class="text-gray-300 text-xs">
              {formatFileSize(selectedPhoto.size)}
              {#if selectedPhoto.metadata?.deviceInfo}
                • {selectedPhoto.metadata.deviceInfo.split(' ')[0]}
              {/if}
            </div>
          {/if}
        </div>
        
        {#if allowDownload}
          <Button
            variant="outline"
            size="sm"
            on:click={() => downloadPhoto(selectedPhoto)}
            class="mt-2"
          >
            Download
          </Button>
        {/if}
      </div>

      <!-- Navigation Dots -->
      {#if photos.length > 1}
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {#each photos as _, index}
            <button
              on:click={() => selectedPhotoIndex = index}
              class="w-2 h-2 rounded-full transition-colors {index === selectedPhotoIndex ? 'bg-white' : 'bg-white bg-opacity-50'}"
            />
          {/each}
        </div>
      {/if}
    </div>
  </Modal>
{/if}
