<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { uploadConditionPhoto } from '$lib/services/condition-photos';
  
  
  export let bookingId;
  export let photoType;
  export let uploadedBy;
  export let uploadedByRole: 'owner' | 'renter';
  export let maxFiles = 5;
  export let acceptedTypes = 'image/*';
  export let disabled = false;
  
  const dispatch = createEventDispatcher();
  
  let fileInput: HTMLInputElement;
  let uploadProgress: PhotoUploadProgress[] = [];
  let dragOver = false;

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      handleFiles(Array.from(target.files));
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    if (event.dataTransfer?.files) {
      handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  async function handleFiles(files: File[]) {
    if (disabled) return;
    
    // Filter valid image files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        dispatch('error', { message: `${file.name} is not a valid image file` });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        dispatch('error', { message: `${file.name} is too large (max 10MB)` });
        return false;
      }
      return true;
    });

    // Check file count limit
    if (uploadProgress.length + validFiles.length > maxFiles) {
      dispatch('error', { message: `Maximum ${maxFiles} files allowed` });
      return;
    }

    // Create upload progress entries
    const newUploads: PhotoUploadProgress[] = validFiles.map(file => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      file,
      progress: 0,
      status: 'pending'
    }));

    uploadProgress = [...uploadProgress, ...newUploads];

    // Upload files
    for (const upload of newUploads) {
      try {
        upload.status = 'uploading';
        uploadProgress = [...uploadProgress];

        const photo = await uploadConditionPhoto(
          upload.file,
          bookingId,
          photoType,
          uploadedBy,
          uploadedByRole,
          (progress) => {
            upload.progress = progress;
            uploadProgress = [...uploadProgress];
          }
        );

        upload.status = 'completed';
        upload.url = photo.url;
        uploadProgress = [...uploadProgress];

        dispatch('uploaded', { photo });

      } catch (error) {
        upload.status = 'error';
        upload.error = error.message;
        uploadProgress = [...uploadProgress];
        
        dispatch('error', { message: `Failed to upload ${upload.file.name}: ${error.message}` });
      }
    }
  }

  function removeUpload(uploadId) {
    uploadProgress = uploadProgress.filter(upload => upload.id !== uploadId);
  }

  function triggerFileSelect() {
    if (!disabled) {
      fileInput.click();
    }
  }
</script>

<div class="photo-uploader">
  <!-- Hidden file input -->
  <input
    bind:this="{fileInput}"
    type="file"
    multiple
    accept="{acceptedTypes}"
    on:change="{handleFileSelect}"
    class="hidden"
  />

  <!-- Drop zone -->
  <div
    class="drop-zone {dragOver ? 'drag-over' : ''} {disabled ? 'disabled' : ''}"
    on:click="{triggerFileSelect}"
    on:drop="{handleDrop}"
    on:dragover="{handleDragOver}"
    on:dragleave="{handleDragLeave}"
    role="button"
    tabindex="0"
  >
    <div class="drop-zone-content">
      <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p class="upload-text">
        {#if disabled}
          Upload disabled
        {:else}
          Click to upload or drag and drop
        {/if}
      </p>
      <p class="upload-subtext">
        PNG, JPG, GIF up to 10MB (max {maxFiles} files)
      </p>
    </div>
  </div>

  <!-- Upload progress -->
  {#if uploadProgress.length > 0}
    <div class="upload-progress">
      {#each uploadProgress as upload (upload.id)}
        <div class="upload-item">
          <div class="upload-info">
            <span class="file-name">{upload.file.name}</span>
            <span class="file-size">{(upload.file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          
          <div class="upload-status">
            {#if upload.status === 'pending'}
              <span class="status-pending">Pending</span>
            {:else if upload.status === 'uploading'}
              <div class="progress-bar">
                <div class="progress-fill" style="width: {upload.progress}%"></div>
              </div>
              <span class="progress-text">{Math.round(upload.progress)}%</span>
            {:else if upload.status === 'completed'}
              <span class="status-completed">✅ Uploaded</span>
            {:else if upload.status === 'error'}
              <span class="status-error">❌ {upload.error}</span>
            {/if}
          </div>

          <button
            type="button"
            on:click={() => removeUpload(upload.id)}
            class="remove-button"
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .photo-uploader {
    width: 100%;
  }

  .drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.05);
  }

  .drop-zone:hover:not(.disabled) {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }

  .drop-zone.drag-over {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.2);
  }

  .drop-zone.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .upload-icon {
    width: 3rem;
    height: 3rem;
    color: #9ca3af;
  }

  .upload-text {
    font-size: 1rem;
    font-weight: 500;
    color: #ffffff;
    margin: 0;
  }

  .upload-subtext {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
  }

  .upload-progress {
    margin-top: 1rem;
    space-y: 0.5rem;
  }

  .upload-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .upload-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .file-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #ffffff;
  }

  .file-size {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .upload-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    width: 100px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.2s ease;
  }

  .progress-text {
    font-size: 0.75rem;
    color: #9ca3af;
    min-width: 3rem;
  }

  .status-pending {
    font-size: 0.75rem;
    color: #fbbf24;
  }

  .status-completed {
    font-size: 0.75rem;
    color: #10b981;
  }

  .status-error {
    font-size: 0.75rem;
    color: #ef4444;
  }

  .remove-button {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    line-height: 1;
  }

  .remove-button:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .hidden {
    display: none;
  }
</style>
