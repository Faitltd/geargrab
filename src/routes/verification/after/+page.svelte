<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { CameraService, type CapturedPhoto } from '$lib/services/camera';
  import { 
    completeConditionCheck, 
    getCurrentLocation,
    getRentalConditionChecks,
    type ConditionCheck
  } from '$lib/services/conditionCheck';
  import PhotoThumbnailGallery from '$lib/components/verification/PhotoThumbnailGallery.svelte';
  import { showToast } from '$lib/stores/toast.store';

  // URL parameters
  let rentalId: string | null = null;
  let listingId: string | null = null;
  let ownerId: string | null = null;
  let userRole: 'renter' | 'owner' = 'renter';

  // Camera state
  let cameraService: CameraService | null = null;
  let videoElement: HTMLVideoElement;
  let isCameraActive = false;
  let cameraError = '';
  let isInitializingCamera = false;

  // Photo capture state
  let capturedPhotos: CapturedPhoto[] = [];
  let isCapturing = false;
  let captureError = '';

  // Before photos for comparison
  let beforeConditionCheck: ConditionCheck | null = null;
  let isLoadingBeforePhotos = false;

  // Submission state
  let isSubmitting = false;
  let uploadProgress = 0;
  let notes = '';

  // Constants
  const MIN_PHOTOS = 3;
  const MAX_PHOTOS = 10;

  onMount(async () => {
    // Get URL parameters
    rentalId = $page.url.searchParams.get('rentalId');
    listingId = $page.url.searchParams.get('listingId');
    ownerId = $page.url.searchParams.get('ownerId');
    const roleParam = $page.url.searchParams.get('role');
    
    if (roleParam === 'owner' || roleParam === 'renter') {
      userRole = roleParam;
    }

    // Validate required parameters
    if (!rentalId || !listingId || !ownerId) {
      showToast('error', 'Missing required verification parameters');
      goto('/dashboard/bookings');
      return;
    }

    // Check authentication
    if (!$authStore.user) {
      showToast('error', 'Please sign in to continue');
      goto('/auth/signin');
      return;
    }

    // Verify user has permission (is renter or owner)
    if ($authStore.user.uid !== ownerId && userRole === 'owner') {
      showToast('error', 'You do not have permission to access this verification');
      goto('/dashboard/bookings');
      return;
    }

    // Load before photos for comparison
    await loadBeforePhotos();

    // Initialize camera
    await initializeCamera();
  });

  onDestroy(async () => {
    await cleanupCamera();
  });

  const loadBeforePhotos = async () => {
    if (!rentalId) return;

    isLoadingBeforePhotos = true;
    try {
      const conditionChecks = await getRentalConditionChecks(rentalId);
      beforeConditionCheck = conditionChecks.find(check => check.type === 'before') || null;
      
      if (!beforeConditionCheck) {
        showToast('warning', 'No before photos found. Please complete the pre-pickup verification first.');
      }
    } catch (error: any) {
      console.error('Error loading before photos:', error);
      showToast('error', 'Failed to load before photos for comparison');
    } finally {
      isLoadingBeforePhotos = false;
    }
  };

  const initializeCamera = async () => {
    if (!CameraService.isSupported()) {
      cameraError = 'Camera not supported in this browser';
      return;
    }

    isInitializingCamera = true;
    cameraError = '';

    try {
      cameraService = new CameraService({
        facingMode: 'environment',
        quality: 0.8
      });

      await cameraService.initialize(videoElement);
      isCameraActive = true;
    } catch (error: any) {
      console.error('Camera initialization error:', error);
      cameraError = error.message || 'Failed to initialize camera';
    } finally {
      isInitializingCamera = false;
    }
  };

  const cleanupCamera = async () => {
    if (cameraService) {
      await cameraService.cleanup();
      cameraService = null;
    }
    isCameraActive = false;
  };

  const capturePhoto = async () => {
    if (!cameraService || !isCameraActive || isCapturing) return;

    if (capturedPhotos.length >= MAX_PHOTOS) {
      showToast('warning', `Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    isCapturing = true;
    captureError = '';

    try {
      const photo = await cameraService.capturePhoto();
      capturedPhotos = [...capturedPhotos, photo];
      showToast('success', 'Photo captured successfully');
    } catch (error: any) {
      console.error('Photo capture error:', error);
      captureError = error.message || 'Failed to capture photo';
      showToast('error', captureError);
    } finally {
      isCapturing = false;
    }
  };

  const deletePhoto = (event: CustomEvent) => {
    const { index } = event.detail;
    capturedPhotos = capturedPhotos.filter((_, i) => i !== index);
    showToast('info', 'Photo deleted');
  };

  const retakePhoto = (event: CustomEvent) => {
    const { index } = event.detail;
    capturedPhotos = capturedPhotos.filter((_, i) => i !== index);
    showToast('info', 'Photo removed. Capture a new one to replace it.');
  };

  const reorderPhotos = (event: CustomEvent) => {
    const { fromIndex, toIndex } = event.detail;
    const newPhotos = [...capturedPhotos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    capturedPhotos = newPhotos;
  };

  const switchCamera = async () => {
    if (!cameraService || !isCameraActive) return;

    try {
      await cameraService.switchCamera();
      showToast('success', 'Camera switched');
    } catch (error: any) {
      console.error('Camera switch error:', error);
      showToast('error', 'Failed to switch camera');
    }
  };

  const submitVerification = async () => {
    if (!rentalId || !listingId || !ownerId || !$authStore.user) return;

    if (capturedPhotos.length < MIN_PHOTOS) {
      showToast('error', `Please capture at least ${MIN_PHOTOS} photos`);
      return;
    }

    isSubmitting = true;
    uploadProgress = 0;

    try {
      const location = await getCurrentLocation();

      const conditionCheckId = await completeConditionCheck(
        rentalId,
        listingId,
        userRole === 'renter' ? $authStore.user.uid : ownerId,
        userRole === 'owner' ? $authStore.user.uid : ownerId,
        'after',
        capturedPhotos,
        notes.trim() || undefined,
        location,
        (progress) => {
          uploadProgress = progress;
        }
      );

      showToast('success', 'Return condition check completed successfully!');
      
      // Redirect to comparison page
      goto(`/verification/compare?rentalId=${rentalId}&conditionCheckId=${conditionCheckId}`);

    } catch (error: any) {
      console.error('Verification submission error:', error);
      showToast('error', error.message || 'Failed to submit verification');
    } finally {
      isSubmitting = false;
      uploadProgress = 0;
    }
  };

  // Computed values
  $: hasMinPhotos = capturedPhotos.length >= MIN_PHOTOS;
  $: canSubmit = hasMinPhotos && !isSubmitting && !isCapturing;
  $: pageTitle = userRole === 'owner' ? 'Owner Return Verification' : 'Return Condition Check';
  $: pageDescription = userRole === 'owner' 
    ? 'Verify the condition of your gear upon return'
    : 'Document the condition of the gear when returning it';
</script>

<svelte:head>
  <title>{pageTitle} - GearGrab</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-neutral-900 mb-4">
        {pageTitle}
      </h1>
      <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
        {pageDescription}. These photos will be compared with the pre-pickup photos to assess any changes in condition.
      </p>
    </div>

    <!-- Before Photos Preview (if available) -->
    {#if beforeConditionCheck && beforeConditionCheck.photos.length > 0}
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-neutral-900 mb-4">
          Before Photos (For Reference)
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each beforeConditionCheck.photos.slice(0, 4) as photo, index}
            <div class="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
              <img
                src={photo.url}
                alt="Before photo {index + 1}"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div class="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
                Before {index + 1}
              </div>
            </div>
          {/each}
          {#if beforeConditionCheck.photos.length > 4}
            <div class="aspect-square bg-neutral-200 rounded-lg flex items-center justify-center">
              <span class="text-neutral-600 text-sm">
                +{beforeConditionCheck.photos.length - 4} more
              </span>
            </div>
          {/if}
        </div>
      </div>
    {:else if isLoadingBeforePhotos}
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
          <span class="text-neutral-600">Loading before photos...</span>
        </div>
      </div>
    {/if}

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Camera Section -->
      <div class="space-y-6">
        <!-- Camera Preview -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="p-6 border-b border-neutral-200">
            <h2 class="text-xl font-semibold text-neutral-900">
              Camera - After Photos
            </h2>
          </div>
          
          <div class="relative aspect-video bg-neutral-900">
            {#if isInitializingCamera}
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-white">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Initializing camera...</p>
                </div>
              </div>
            {:else if cameraError}
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-white p-6">
                  <svg class="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 class="text-lg font-medium mb-2">Camera Error</h3>
                  <p class="text-sm text-neutral-300 mb-4">{cameraError}</p>
                  <button
                    on:click={initializeCamera}
                    class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            {:else}
              <video
                bind:this={videoElement}
                class="w-full h-full object-cover"
                autoplay
                muted
                playsinline
              ></video>
              
              <div class="absolute inset-0 pointer-events-none">
                <div class="absolute inset-4 border-2 border-white/30 rounded-lg">
                  <div class="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {#each Array(4) as _}
                      <div class="border-r border-white/20 last:border-r-0"></div>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}
          </div>
          
          <!-- Camera Controls -->
          <div class="p-6 bg-neutral-50">
            <div class="flex items-center justify-center space-x-4">
              <button
                on:click={switchCamera}
                disabled={!isCameraActive || isCapturing}
                class="p-3 bg-neutral-200 hover:bg-neutral-300 disabled:bg-neutral-100 disabled:cursor-not-allowed text-neutral-700 rounded-full transition-colors"
                title="Switch camera"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button
                on:click={capturePhoto}
                disabled={!isCameraActive || isCapturing || capturedPhotos.length >= MAX_PHOTOS}
                class="p-4 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-lg"
                title="Capture photo"
              >
                {#if isCapturing}
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                {:else}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                {/if}
              </button>
            </div>
            
            {#if captureError}
              <p class="text-sm text-red-600 text-center mt-2">{captureError}</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Photos and Submission Section -->
      <div class="space-y-6">
        <!-- Photo Gallery -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <PhotoThumbnailGallery
            bind:photos={capturedPhotos}
            minPhotos={MIN_PHOTOS}
            maxPhotos={MAX_PHOTOS}
            disabled={isSubmitting}
            showProgress={isSubmitting}
            uploadProgress={uploadProgress}
            on:delete={deletePhoto}
            on:retake={retakePhoto}
            on:reorder={reorderPhotos}
          />
        </div>

        <!-- Notes Section -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-neutral-900 mb-4">
            Return Notes (Optional)
          </h3>
          <textarea
            bind:value={notes}
            disabled={isSubmitting}
            placeholder="Note any changes, damage, or observations about the gear's condition upon return..."
            class="w-full h-24 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 resize-none"
            maxlength="500"
          ></textarea>
          <div class="flex justify-between items-center mt-2">
            <span class="text-sm text-neutral-500">
              {notes.length}/500 characters
            </span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <button
            on:click={submitVerification}
            disabled={!canSubmit}
            class="w-full py-4 px-6 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {#if isSubmitting}
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting Return Verification...</span>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Complete Return Verification</span>
            {/if}
          </button>
          
          {#if !hasMinPhotos}
            <p class="text-sm text-neutral-500 text-center mt-2">
              Capture at least {MIN_PHOTOS} photos to continue
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
