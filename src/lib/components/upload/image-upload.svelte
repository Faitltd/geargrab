<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { uploadToFirebaseStorage, compressImage } from '$lib/services/storage';
  
  export let images: string[] = [];
  export let maxImages = 5;
  export let maxSizeMB = 5;
  export let allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  export let folder = 'listings';
  export let disabled = false;
  
  const dispatch = createEventDispatcher<{
    imagesChanged: string[];
    uploadStart: void;
    uploadComplete: void;
    uploadError: string;
  }>();
  
  let uploading = false;
  let dragOver = false;
  let fileInput: HTMLInputElement;
  
  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (files) {
      await processFiles(Array.from(files));
    }
  }
  
  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      await processFiles(Array.from(files));
    }
  }
  
  async function processFiles(files: File[]) {
    if (disabled || uploading) return;
    
    // Check if we can add more images
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      dispatch('uploadError', `Maximum ${maxImages} images allowed`);
      return;
    }
    
    // Limit files to remaining slots
    const filesToProcess = files.slice(0, remainingSlots);
    
    // Validate files
    const validFiles = [];
    for (const file of filesToProcess) {
      if (!allowedTypes.includes(file.type)) {
        dispatch('uploadError', `File type ${file.type} not allowed`);
        continue;
      }
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        dispatch('uploadError', `File ${file.name} is too large (max ${maxSizeMB}MB)`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    try {
      uploading = true;
      dispatch('uploadStart');
      
      const uploadPromises = validFiles.map(async (file) => {
        // Compress image before upload
        const compressedFile = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8
        });
        
        // Upload to Firebase Storage
        const url = await uploadToFirebaseStorage(compressedFile, folder);
        return url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls];
      
      images = newImages;
      dispatch('imagesChanged', newImages);
      dispatch('uploadComplete');
      
    } catch (error) {
      console.error('Error uploading images:', error);
      dispatch('uploadError', error instanceof Error ? error.message : 'Upload failed');
    } finally {
      uploading = false;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }
  
  function removeImage(index: number) {
    if (disabled || uploading) return;
    
    const newImages = images.filter((_, i) => i !== index);
    images = newImages;
    dispatch('imagesChanged', newImages);
  }
  
  function reorderImages(fromIndex: number, toIndex: number) {
    if (disabled || uploading) return;
    
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    images = newImages;
    dispatch('imagesChanged', newImages);
  }
  
  function handleDragStart(event: DragEvent, index: number) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }
  
  function handleImageDrop(event: DragEvent, toIndex: number) {
    event.preventDefault();
    
    const fromIndex = parseInt(event.dataTransfer?.getData('text/plain') || '');
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      reorderImages(fromIndex, toIndex);
    }
  }
</script>

<div class="image-upload">
  <!-- Upload Area -->
  {#if images.length < maxImages}
    <div 
      class="upload-area {dragOver ? 'drag-over' : ''} {uploading ? 'uploading' : ''}"
      on:click={() => !disabled && !uploading && fileInput?.click()}
      on:dragenter|preventDefault={() => dragOver = true}
      on:dragover|preventDefault
      on:dragleave|preventDefault={() => dragOver = false}
      on:drop|preventDefault={handleDrop}
      role="button"
      tabindex="0"
    >
      <input
        bind:this={fileInput}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        on:change={handleFileSelect}
        disabled={disabled || uploading}
        style="display: none;"
      />
      
      {#if uploading}
        <div class="upload-spinner">
          <div class="spinner"></div>
          <p>Uploading images...</p>
        </div>
      {:else}
        <div class="upload-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          <h3>Add Photos</h3>
          <p>Drag and drop images here or click to browse</p>
          <p class="upload-info">
            {images.length}/{maxImages} images • Max {maxSizeMB}MB each
          </p>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Image Grid -->
  {#if images.length > 0}
    <div class="image-grid">
      {#each images as image, index}
        <div 
          class="image-item {index === 0 ? 'primary' : ''}"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, index)}
          on:dragover={handleDragOver}
          on:drop={(e) => handleImageDrop(e, index)}
        >
          <img src={image} alt="Upload {index + 1}" />
          
          {#if index === 0}
            <div class="primary-badge">Primary</div>
          {/if}
          
          <div class="image-overlay">
            <button 
              class="remove-btn"
              on:click={() => removeImage(index)}
              disabled={disabled || uploading}
              title="Remove image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
            
            {#if index > 0}
              <button 
                class="primary-btn"
                on:click={() => reorderImages(index, 0)}
                disabled={disabled || uploading}
                title="Make primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
                </svg>
              </button>
            {/if}
          </div>
          
          <div class="drag-handle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z"/>
            </svg>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Upload Tips -->
  {#if images.length === 0}
    <div class="upload-tips">
      <h4>Photo Tips</h4>
      <ul>
        <li>Use high-quality, well-lit photos</li>
        <li>Show the gear from multiple angles</li>
        <li>Include any accessories or parts</li>
        <li>First photo will be the main listing image</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .image-upload {
    width: 100%;
  }

  .upload-area {
    border: 2px dashed #ddd;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fafafa;
    margin-bottom: 20px;
  }

  .upload-area:hover {
    border-color: #007bff;
    background: #f0f8ff;
  }

  .upload-area.drag-over {
    border-color: #007bff;
    background: #e3f2fd;
    transform: scale(1.02);
  }

  .upload-area.uploading {
    border-color: #28a745;
    background: #f8fff9;
    cursor: not-allowed;
  }

  .upload-content svg {
    color: #666;
    margin-bottom: 16px;
  }

  .upload-content h3 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 18px;
  }

  .upload-content p {
    margin: 4px 0;
    color: #666;
    font-size: 14px;
  }

  .upload-info {
    font-size: 12px !important;
    color: #999 !important;
  }

  .upload-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .image-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    cursor: move;
    transition: transform 0.2s;
    border: 2px solid transparent;
  }

  .image-item:hover {
    transform: scale(1.02);
  }

  .image-item.primary {
    border-color: #007bff;
  }

  .image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .primary-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .image-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .image-item:hover .image-overlay {
    opacity: 1;
  }

  .remove-btn, .primary-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .remove-btn {
    background: rgba(220, 53, 69, 0.9);
    color: white;
  }

  .remove-btn:hover {
    background: #dc3545;
  }

  .primary-btn {
    background: rgba(0, 123, 255, 0.9);
    color: white;
  }

  .primary-btn:hover {
    background: #007bff;
  }

  .drag-handle {
    position: absolute;
    bottom: 8px;
    right: 8px;
    color: white;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .image-item:hover .drag-handle {
    opacity: 1;
  }

  .upload-tips {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    border-left: 4px solid #007bff;
  }

  .upload-tips h4 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 16px;
  }

  .upload-tips ul {
    margin: 0;
    padding-left: 20px;
    color: #666;
  }

  .upload-tips li {
    margin-bottom: 4px;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .image-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .upload-area {
      padding: 30px 15px;
    }
  }
</style>
