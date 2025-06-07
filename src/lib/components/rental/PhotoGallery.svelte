<!--
  Photo Gallery for Rental Documentation
  Displays uploaded photos with metadata and viewing options
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { RentalPhoto } from '$lib/types/firestore';
  
  // Props
  export let photos: RentalPhoto[];
  export let editable: boolean = false;
  
  // Internal state
  let selectedPhoto: RentalPhoto | null = null;
  let showModal = false;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Photo type icons and labels
  const photoTypeInfo = {
    condition: { icon: '🔍', label: 'Overall Condition' },
    damage: { icon: '⚠️', label: 'Damage/Issues' },
    serial_number: { icon: '🔢', label: 'Serial Number' },
    accessories: { icon: '🎒', label: 'Accessories' },
    general: { icon: '📷', label: 'General' }
  };
  
  function openPhotoModal(photo: RentalPhoto) {
    selectedPhoto = photo;
    showModal = true;
  }
  
  function closePhotoModal() {
    selectedPhoto = null;
    showModal = false;
  }
  
  function formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleString();
  }
  
  function getPhotoTypeInfo(type: string) {
    return photoTypeInfo[type] || { icon: '📷', label: 'Photo' };
  }
  
  async function deletePhoto(photo: RentalPhoto) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      // TODO: Implement photo deletion API
      dispatch('deleted', { photo });
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  }
  
  function handleKeydown(event: KeyboardEvent, photo: RentalPhoto) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPhotoModal(photo);
    }
  }
  
  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closePhotoModal();
    }
  }
</script>

{#if photos.length > 0}
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {#each photos as photo}
      <div class="photo-card group">
        <!-- Photo Thumbnail -->
        <div 
          class="photo-thumbnail"
          on:click={() => openPhotoModal(photo)}
          on:keydown={(e) => handleKeydown(e, photo)}
          tabindex="0"
          role="button"
          aria-label="View photo: {photo.description || 'Rental documentation photo'}"
        >
          <img
            src={photo.url}
            alt={photo.description || 'Rental documentation photo'}
            class="w-full h-full object-cover"
            loading="lazy"
          />
          
          <!-- Overlay with photo type -->
          <div class="photo-overlay">
            <div class="photo-type">
              <span class="text-lg">{getPhotoTypeInfo(photo.photoType).icon}</span>
              <span class="text-xs font-medium">{getPhotoTypeInfo(photo.photoType).label}</span>
            </div>
          </div>
          
          <!-- Actions (if editable) -->
          {#if editable}
            <div class="photo-actions">
              <button
                type="button"
                on:click|stopPropagation={() => deletePhoto(photo)}
                class="delete-btn"
                aria-label="Delete photo"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          {/if}
        </div>
        
        <!-- Photo Info -->
        <div class="photo-info">
          {#if photo.description}
            <p class="text-sm text-white font-medium truncate" title={photo.description}>
              {photo.description}
            </p>
          {/if}
          <p class="text-xs text-gray-400">
            {formatDate(photo.uploadedAt)}
          </p>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="text-center py-8 text-gray-400">
    <svg class="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
    <p>No photos uploaded yet</p>
  </div>
{/if}

<!-- Photo Modal -->
{#if showModal && selectedPhoto}
  <div 
    class="photo-modal"
    on:click={closePhotoModal}
    on:keydown={handleModalKeydown}
    tabindex="0"
    role="dialog"
    aria-modal="true"
    aria-label="Photo viewer"
  >
    <div class="modal-content" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h3 class="text-lg font-semibold text-white">
            {getPhotoTypeInfo(selectedPhoto.photoType).icon}
            {getPhotoTypeInfo(selectedPhoto.photoType).label}
          </h3>
          {#if selectedPhoto.description}
            <p class="text-gray-300 text-sm">{selectedPhoto.description}</p>
          {/if}
        </div>
        <button
          type="button"
          on:click={closePhotoModal}
          class="close-btn"
          aria-label="Close photo viewer"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Modal Image -->
      <div class="modal-image">
        <img
          src={selectedPhoto.url}
          alt={selectedPhoto.description || 'Rental documentation photo'}
          class="max-w-full max-h-full object-contain"
        />
      </div>
      
      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="text-sm text-gray-400">
          <p>Uploaded: {formatDate(selectedPhoto.uploadedAt)}</p>
          <p>File: {selectedPhoto.fileName}</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .photo-card {
    @apply bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all;
  }

  .photo-thumbnail {
    @apply relative aspect-square cursor-pointer overflow-hidden;
  }

  .photo-thumbnail:hover .photo-overlay {
    @apply opacity-100;
  }

  .photo-thumbnail:focus {
    @apply outline-none ring-2 ring-green-500/50;
  }

  .photo-overlay {
    @apply absolute inset-0 bg-black/50 opacity-0 transition-opacity flex items-end p-2;
  }

  .photo-type {
    @apply flex items-center space-x-1 text-white;
  }

  .photo-actions {
    @apply absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity;
  }

  .delete-btn {
    @apply bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full transition-colors;
  }

  .photo-info {
    @apply p-3 space-y-1;
  }

  .photo-modal {
    @apply fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4;
  }

  .modal-content {
    @apply bg-gray-900 rounded-lg max-w-4xl max-h-full w-full flex flex-col overflow-hidden;
  }

  .modal-header {
    @apply flex items-start justify-between p-4 border-b border-white/10;
  }

  .close-btn {
    @apply text-gray-400 hover:text-white transition-colors;
  }

  .modal-image {
    @apply flex-1 flex items-center justify-center p-4 min-h-0;
  }

  .modal-footer {
    @apply p-4 border-t border-white/10;
  }
</style>
