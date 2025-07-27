<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { UploadFile } from '$lib/api/integrations.js';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import CardHeader from './ui/CardHeader.svelte';
  import CardContent from './ui/CardContent.svelte';
  import CardTitle from './ui/CardTitle.svelte';
  import Label from './ui/Label.svelte';
  import Textarea from './ui/Textarea.svelte';
  import Alert from './ui/Alert.svelte';
  import AlertDescription from './ui/AlertDescription.svelte';
  import { Camera, Upload, X, AlertCircle, CheckCircle, Info } from 'lucide-svelte';
  import { validateFiles, validatePhotoDocumentation, getPhotoChecklist, compressImage } from '$lib/utils/photoValidation.js';

  export let title = "Photo Documentation";
  export let description = "Please take photos to document the condition";
  export let photos: string[] = [];
  export let notes = "";
  export let isUploading = false;
  export let isSubmitting = false;
  export let minPhotos = 1;
  export let maxPhotos = 10;
  export let required = true;
  export let showNotes = true;
  export let submitButtonText = "Submit Photos";
  export let cancelButtonText = "Cancel";
  export let documentationType: 'checkout' | 'pickup' | 'return' = 'checkout';

  const dispatch = createEventDispatcher();

  let dragActive = false;
  let errors: string[] = [];
  let showChecklist = false;
  let fileInputRef: HTMLInputElement;
  let cameraInputRef: HTMLInputElement;

  $: checklist = getPhotoChecklist(documentationType);

  function validatePhotos() {
    const validation = validatePhotoDocumentation(photos, documentationType);
    errors = validation.errors;
    return validation.isValid;
  }

  async function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    
    // Validate files first
    const validation = await validateFiles(files, {
      maxFiles: maxPhotos - photos.length,
      minFiles: 1,
      allowDuplicates: false
    });

    if (!validation.isValid) {
      errors = validation.errors;
      return;
    }

    try {
      // Compress images if needed
      const compressedFiles = await Promise.all(
        validation.validFiles.map(file => 
          file.size > 2 * 1024 * 1024 ? compressImage(file) : file
        )
      );

      // Upload files
      const uploadPromises = compressedFiles.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map(result => result.file_url);
      
      photos = [...photos, ...newPhotoUrls];
      dispatch('photosChange', photos);
      errors = [];
    } catch (error) {
      console.error("Error uploading photos:", error);
      errors = ["Failed to upload photos. Please try again."];
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      handleFileSelect(files);
    }
  }

  function handleDrag(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      dragActive = true;
    } else if (event.type === "dragleave") {
      dragActive = false;
    }
  }

  function removePhoto(indexToRemove: number) {
    photos = photos.filter((_, index) => index !== indexToRemove);
    dispatch('photosChange', photos);
    errors = [];
  }

  function handleSubmit() {
    if (validatePhotos()) {
      dispatch('submit');
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function openCamera() {
    cameraInputRef?.click();
  }

  function openFileSelector() {
    fileInputRef?.click();
  }

  function handleNotesChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    notes = target.value;
    dispatch('notesChange', notes);
  }
</script>

<Card className="w-full max-w-2xl mx-auto">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Camera class="w-5 h-5" />
      {title}
    </CardTitle>
    <p class="text-sm text-gray-600">{description}</p>
  </CardHeader>
  <CardContent className="space-y-6">
    <!-- Photo Checklist -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label className="text-base font-medium">Photo Requirements</Label>
        <Button
          variant="ghost"
          size="sm"
          on:click={() => showChecklist = !showChecklist}
          className="text-blue-600 hover:text-blue-700"
        >
          <Info class="w-4 h-4 mr-1" />
          {showChecklist ? 'Hide' : 'Show'} Checklist
        </Button>
      </div>
      
      {#if showChecklist}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800 mb-3 font-medium">
            Please ensure your photos include:
          </p>
          <ul class="space-y-1">
            {#each checklist as item}
              <li class="text-sm text-blue-700 flex items-start">
                <span class="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {item}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <!-- Upload Area -->
    <div class="space-y-4">
      <Label>Upload Photos ({photos.length}/{maxPhotos})</Label>
      
      <!-- Drag and Drop Area -->
      <div
        class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors {dragActive 
          ? 'border-emerald-500 bg-emerald-50' 
          : 'border-gray-300 hover:border-gray-400'}"
        on:dragenter={handleDrag}
        on:dragleave={handleDrag}
        on:dragover={handleDrag}
        on:drop={handleDrop}
        role="button"
        tabindex="0"
      >
        <div class="space-y-4">
          <div class="flex justify-center">
            <Camera class="w-12 h-12 text-gray-400" />
          </div>
          <div>
            <p class="text-lg font-medium text-gray-700">
              Drop photos here or click to upload
            </p>
            <p class="text-sm text-gray-500">
              Supports JPG, PNG, HEIC formats
            </p>
          </div>
          
          <div class="flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              on:click={openCamera}
              disabled={isUploading || photos.length >= maxPhotos}
              className="flex items-center gap-2"
            >
              <Camera class="w-4 h-4" />
              Take Photo
            </Button>
            
            <Button
              type="button"
              variant="outline"
              on:click={openFileSelector}
              disabled={isUploading || photos.length >= maxPhotos}
              className="flex items-center gap-2"
            >
              <Upload class="w-4 h-4" />
              Choose Files
            </Button>
          </div>
        </div>
      </div>

      <!-- Hidden File Inputs -->
      <input
        bind:this={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        on:change={(e) => handleFileSelect(e.currentTarget.files)}
        class="hidden"
      />
      
      <input
        bind:this={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        on:change={(e) => handleFileSelect(e.currentTarget.files)}
        class="hidden"
      />
    </div>

    <!-- Photo Preview Grid -->
    {#if photos.length > 0}
      <div class="space-y-3">
        <Label>Uploaded Photos</Label>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          {#each photos as photo, index}
            <div class="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={photo} 
                alt="Documentation {index + 1}" 
                class="w-full h-full object-cover"
              />
              <button
                on:click={() => removePhoto(index)}
                class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Notes Section -->
    {#if showNotes}
      <div class="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          bind:value={notes}
          on:input={handleNotesChange}
          placeholder="Any observations about the condition, damage, or special notes..."
          className="h-24 resize-none"
        />
      </div>
    {/if}

    <!-- Error Messages -->
    {#if errors.length > 0}
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          <ul class="list-disc list-inside space-y-1">
            {#each errors as error}
              <li>{error}</li>
            {/each}
          </ul>
        </AlertDescription>
      </Alert>
    {/if}

    <!-- Success Message -->
    {#if photos.length >= minPhotos && errors.length === 0}
      <Alert className="border-emerald-200 bg-emerald-50">
        <CheckCircle class="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-700">
          Photo documentation complete! Ready to proceed.
        </AlertDescription>
      </Alert>
    {/if}

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3 pt-4">
      <Button
        variant="outline"
        on:click={handleCancel}
        disabled={isUploading || isSubmitting}
      >
        {cancelButtonText}
      </Button>
      <Button
        on:click={handleSubmit}
        disabled={isUploading || isSubmitting || (required && photos.length < minPhotos)}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {isUploading ? "Uploading..." : isSubmitting ? "Submitting..." : submitButtonText}
      </Button>
    </div>
  </CardContent>
</Card>
