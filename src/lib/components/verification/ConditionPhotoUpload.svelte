<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { cameraService, type CapturedPhoto } from '$lib/services/camera.service';
  import { uploadBeforePickupPhotos, type UploadProgressCallback } from '$lib/services/conditionCheck';
  import { showToast } from '$lib/stores/toast.store';
  import { authStore } from '$lib/stores/auth.store';
  import Button from '$lib/components/ui/Button.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  // Props
  export let rentalId: string;
  export let minPhotos = 3;
  export let maxPhotos = 10;
  export let title = 'Upload Condition Photos';
  export let instructions = 'Take clear photos of the gear from multiple angles to document its current condition.';

  // State
  let videoElement: HTMLVideoElement;
  let cameraInitialized = false;
  let capturedPhotos: CapturedPhoto[] = [];
  let isCapturing = false;
  let isUploading = false;
  let uploadProgress = 0;
  let currentPhotoIndex = 0;
  let notes = '';
  let cameraError = '';

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    complete: { conditionCheckId: string };
    cancel: void;
  }>();

  // Reactive statements
  $: canCapture = cameraInitialized && !isCapturing && capturedPhotos.length < maxPhotos;
  $: canUpload = capturedPhotos.length >= minPhotos && !isUploading;
  $: photosRemaining = maxPhotos - capturedPhotos.length;

  onMount(async () => {
    await initializeCamera();
  });

  onDestroy(() => {
    cameraService.destroy();
  });

  async function initializeCamera() {
    try {
      cameraError = '';
      
      if (!cameraService.isSupported()) {
        throw new Error('Camera not supported on this device');
      }

      await cameraService.initialize(videoElement);
      cameraInitialized = true;
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      cameraError = error instanceof Error ? error.message : 'Failed to initialize camera';
      showToast('error', cameraError);
    }
  }

  async function capturePhoto() {
    if (!canCapture) return;

    try {
      isCapturing = true;
      const photo = await cameraService.capturePhoto(0.9);
      capturedPhotos = [...capturedPhotos, photo];
      showToast('success', `Photo ${capturedPhotos.length} captured`);
    } catch (error) {
      console.error('Failed to capture photo:', error);
      showToast('error', 'Failed to capture photo');
    } finally {
      isCapturing = false;
    }
  }

  function removePhoto(index: number) {
    // Revoke object URL to free memory
    URL.revokeObjectURL(capturedPhotos[index].url);
    capturedPhotos = capturedPhotos.filter((_, i) => i !== index);
  }

  async function switchCamera() {
    try {
      await cameraService.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
      showToast('error', 'Failed to switch camera');
    }
  }

  async function uploadPhotos() {
    if (!canUpload) return;

    const user = $authStore.data;
    if (!user) {
      showToast('error', 'Please sign in to upload photos');
      return;
    }

    try {
      isUploading = true;
      uploadProgress = 0;
      currentPhotoIndex = 0;

      const progressCallback: UploadProgressCallback = (progress, photoIndex) => {
        uploadProgress = progress;
        currentPhotoIndex = photoIndex + 1;
      };

      const conditionCheckId = await uploadBeforePickupPhotos(
        rentalId,
        capturedPhotos,
        user.uid,
        notes.trim() || undefined,
        progressCallback
      );

      showToast('success', 'Condition photos uploaded successfully!');
      dispatch('complete', { conditionCheckId });

    } catch (error) {
      console.error('Failed to upload photos:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to upload photos');
    } finally {
      isUploading = false;
      uploadProgress = 0;
      currentPhotoIndex = 0;
    }
  }

  function handleCancel() {
    // Clean up captured photos
    capturedPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.url);
    });
    dispatch('cancel');
  }
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <p class="text-gray-600">{instructions}</p>
  </div>

  <!-- Camera Section -->
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Camera</h3>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500">
            {capturedPhotos.length}/{maxPhotos} photos
          </span>
          {#if photosRemaining > 0}
            <span class="text-xs text-blue-600">
              ({photosRemaining} remaining)
            </span>
          {/if}
        </div>
      </div>
    </div>

    <div class="relative">
      {#if cameraError}
        <div class="aspect-video bg-gray-100 flex items-center justify-center">
          <div class="text-center">
            <div class="text-red-500 mb-2">
              <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-red-600 font-medium">{cameraError}</p>
            <Button variant="outline" size="sm" on:click={initializeCamera} class="mt-2">
              Retry
            </Button>
          </div>
        </div>
      {:else}
        <video
          bind:this={videoElement}
          class="w-full aspect-video object-cover bg-black"
          autoplay
          muted
          playsinline
        />
        
        <!-- Camera Controls -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div class="flex items-center space-x-4">
            <Button
              variant="secondary"
              size="sm"
              on:click={switchCamera}
              disabled={!cameraInitialized}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Switch
            </Button>
            
            <Button
              variant="primary"
              size="lg"
              on:click={capturePhoto}
              disabled={!canCapture}
              loading={isCapturing}
              class="w-16 h-16 rounded-full"
            >
              {#if !isCapturing}
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              {/if}
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Captured Photos -->
  {#if capturedPhotos.length > 0}
    <div class="bg-white rounded-lg shadow-md p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Captured Photos</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each capturedPhotos as photo, index}
          <div class="relative group">
            <img
              src={photo.url}
              alt="Condition photo {index + 1}"
              class="w-full aspect-square object-cover rounded-lg border border-gray-200"
            />
            <button
              on:click={() => removePhoto(index)}
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Notes Section -->
  <div class="bg-white rounded-lg shadow-md p-4">
    <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
      Additional Notes (Optional)
    </label>
    <textarea
      id="notes"
      bind:value={notes}
      rows="3"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Add any additional notes about the gear condition..."
      disabled={isUploading}
    />
  </div>

  <!-- Upload Progress -->
  {#if isUploading}
    <div class="bg-white rounded-lg shadow-md p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">
          Uploading photo {currentPhotoIndex} of {capturedPhotos.length}
        </span>
        <span class="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style="width: {uploadProgress}%"
        />
      </div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex justify-between">
    <Button
      variant="outline"
      on:click={handleCancel}
      disabled={isUploading}
    >
      Cancel
    </Button>

    <div class="flex items-center space-x-4">
      {#if capturedPhotos.length < minPhotos}
        <p class="text-sm text-gray-500">
          Take at least {minPhotos - capturedPhotos.length} more photo{minPhotos - capturedPhotos.length !== 1 ? 's' : ''}
        </p>
      {/if}
      
      <Button
        variant="primary"
        on:click={uploadPhotos}
        disabled={!canUpload}
        loading={isUploading}
      >
        {#if isUploading}
          Uploading...
        {:else}
          Upload Photos ({capturedPhotos.length})
        {/if}
      </Button>
    </div>
  </div>
</div>
