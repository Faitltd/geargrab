<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GearConditionPhoto } from '$lib/types/gear-condition';
  
  export let photos: GearConditionPhoto[] = [];
  export let title: string = 'Photos';
  export let allowDelete: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let selectedPhoto: GearConditionPhoto | null = null;
  let showModal = false;

  function openPhoto(photo: GearConditionPhoto) {
    selectedPhoto = photo;
    showModal = true;
  }

  function closeModal() {
    selectedPhoto = null;
    showModal = false;
  }

  function deletePhoto(photo: GearConditionPhoto) {
    dispatch('delete', { photo });
  }

  function formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(timestamp);
  }

  function getRoleColor(role: 'owner' | 'renter'): string {
    return role === 'owner' ? 'text-blue-400' : 'text-green-400';
  }
</script>

<div class="photo-gallery">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-white">{title}</h3>
    <span class="text-sm text-gray-400">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
  </div>

  {#if photos.length > 0}
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {#each photos as photo (photo.id)}
        <div class="photo-item">
          <div class="photo-container">
            <img
              src={photo.url}
              alt={photo.caption || 'Condition photo'}
              class="photo-image"
              on:click={() => openPhoto(photo)}
              loading="lazy"
            />
            
            <!-- Photo overlay -->
            <div class="photo-overlay">
              <div class="photo-info">
                <div class="photo-meta">
                  <span class="photo-role {getRoleColor(photo.uploadedByRole)}">
                    {photo.uploadedByRole}
                  </span>
                  <span class="photo-time">
                    {formatTimestamp(photo.timestamp)}
                  </span>
                </div>
                
                {#if photo.caption}
                  <p class="photo-caption">{photo.caption}</p>
                {/if}
              </div>

              {#if allowDelete}
                <button
                  type="button"
                  on:click|stopPropagation={() => deletePhoto(photo)}
                  class="delete-button"
                  title="Delete photo"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="empty-text">No photos uploaded yet</p>
    </div>
  {/if}
</div>

<!-- Photo Modal -->
{#if showModal && selectedPhoto}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <div class="modal-title">
          <span class="photo-type">{selectedPhoto.photoType.replace(/([A-Z])/g, ' $1').trim()}</span>
          <span class="photo-role {getRoleColor(selectedPhoto.uploadedByRole)}">
            by {selectedPhoto.uploadedByRole}
          </span>
        </div>
        <button
          type="button"
          on:click={closeModal}
          class="modal-close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <img
          src={selectedPhoto.url}
          alt={selectedPhoto.caption || 'Condition photo'}
          class="modal-image"
        />
        
        <div class="modal-details">
          <div class="detail-row">
            <span class="detail-label">Uploaded:</span>
            <span class="detail-value">{formatTimestamp(selectedPhoto.timestamp)}</span>
          </div>
          
          {#if selectedPhoto.caption}
            <div class="detail-row">
              <span class="detail-label">Caption:</span>
              <span class="detail-value">{selectedPhoto.caption}</span>
            </div>
          {/if}

          {#if selectedPhoto.metadata?.notes}
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">{selectedPhoto.metadata.notes}</span>
            </div>
          {/if}

          {#if selectedPhoto.metadata?.location}
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">{selectedPhoto.metadata.location}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .photo-gallery {
    width: 100%;
  }

  .photo-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
  }

  .photo-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .photo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }

  .photo-item:hover .photo-image {
    transform: scale(1.05);
  }

  .photo-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.75rem;
  }

  .photo-item:hover .photo-overlay {
    opacity: 1;
  }

  .photo-info {
    margin-top: auto;
  }

  .photo-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .photo-role {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .photo-time {
    font-size: 0.75rem;
    color: #d1d5db;
  }

  .photo-caption {
    font-size: 0.75rem;
    color: #ffffff;
    margin: 0;
    line-height: 1.2;
  }

  .delete-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(239, 68, 68, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .delete-button:hover {
    background: rgba(239, 68, 68, 1);
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #9ca3af;
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
  }

  .empty-text {
    margin: 0;
    font-size: 0.875rem;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
  }

  .modal-content {
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-title {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .photo-type {
    font-size: 1.125rem;
    font-weight: 600;
    color: #ffffff;
    text-transform: capitalize;
  }

  .modal-close {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.2s ease;
  }

  .modal-close:hover {
    color: #ffffff;
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-image {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    margin: 0 auto;
  }

  .modal-details {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .detail-row:last-child {
    margin-bottom: 0;
  }

  .detail-label {
    font-weight: 500;
    color: #9ca3af;
  }

  .detail-value {
    color: #ffffff;
    text-align: right;
    max-width: 60%;
  }

  @media (min-width: 768px) {
    .modal-content {
      max-width: 800px;
    }

    .modal-body {
      flex-direction: row;
    }

    .modal-image {
      max-height: 500px;
      flex: 1;
    }

    .modal-details {
      width: 300px;
      border-top: none;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
</style>
