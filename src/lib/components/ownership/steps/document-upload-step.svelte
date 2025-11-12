<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let requirement: any;
  export let gearValue: number;
  export let documents: any[] = [];

  const dispatch = createEventDispatcher();

  let uploading = false;
  let uploadProgress = 0;
  let error = '';
  let dragOver = false;

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_DOCUMENTS = 5;

  // Document types with priorities and descriptions
  const documentTypes = [
    {
      type: 'receipt',
      label: 'Purchase Receipt',
      description: 'Original receipt or invoice showing purchase',
      examples: ['Store receipt', 'Online order confirmation', 'Credit card statement'],
      priority: 1,
      icon: '🧾'
    },
    {
      type: 'warranty',
      label: 'Warranty Documentation',
      description: 'Warranty card or registration',
      examples: ['Warranty card', 'Product registration', 'Manufacturer documentation'],
      priority: 2,
      icon: '📜'
    },
    {
      type: 'insurance',
      label: 'Insurance Documentation',
      description: 'Insurance policy or appraisal',
      examples: ['Homeowners insurance', 'Gear insurance policy', 'Professional appraisal'],
      priority: 3,
      icon: '🛡️'
    },
    {
      type: 'serial_number',
      label: 'Serial Number Photo',
      description: 'Clear photo of serial number or model number',
      examples: ['Serial number plate', 'Model sticker', 'Engraved numbers'],
      priority: 4,
      icon: '🔢'
    },
    {
      type: 'manual',
      label: 'Owner\'s Manual',
      description: 'Original manual or documentation',
      examples: ['User manual', 'Setup guide', 'Product documentation'],
      priority: 5,
      icon: '📖'
    },
    {
      type: 'other',
      label: 'Other Documentation',
      description: 'Any other proof of ownership',
      examples: ['Gift receipt', 'Inheritance documentation', 'Transfer of ownership'],
      priority: 6,
      icon: '📄'
    }
  ];

  $: canAddMore = documents.length < MAX_DOCUMENTS;
  $: recommendedTypes = getRecommendedTypes();

  function getRecommendedTypes() {
    if (gearValue >= 500) {
      return ['receipt', 'warranty', 'serial_number'];
    } else if (gearValue >= 200) {
      return ['receipt', 'warranty'];
    } else {
      return ['receipt'];
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      handleFiles(Array.from(input.files));
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
    if (documents.length + files.length > MAX_DOCUMENTS) {
      error = `Maximum ${MAX_DOCUMENTS} documents allowed`;
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
        error = 'Only image files (JPG, PNG) and PDF documents are allowed';
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        error = `File ${file.name} is too large. Maximum size is 10MB`;
        continue;
      }

      await uploadDocument(file);
    }
  }

  async function uploadDocument(file: File) {
    uploading = true;
    uploadProgress = 0;
    error = '';

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        uploadProgress += 10;
        if (uploadProgress >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);

      // Create document object
      const documentData = {
        id: Date.now() + Math.random(),
        file,
        preview,
        name: file.name,
        size: file.size,
        type: 'other', // Default type, user will select
        description: '',
        uploadedAt: new Date().toISOString()
      };

      // Add to documents array
      documents = [...documents, documentData];
      
      // Complete progress
      uploadProgress = 100;
      
      // Dispatch update
      dispatch('stepData', {
        step: 1,
        data: { documents }
      });

    } catch (err) {
      console.error('Upload error:', err);
      error = err.message || 'Failed to upload document';
    } finally {
      uploading = false;
      uploadProgress = 0;
    }
  }

  function removeDocument(documentId: string | number) {
    documents = documents.filter(d => d.id !== documentId);
    
    dispatch('stepData', {
      step: 1,
      data: { documents }
    });
  }

  function updateDocumentType(documentId: string | number, type: string) {
    documents = documents.map(doc => 
      doc.id === documentId ? { ...doc, type } : doc
    );
    
    dispatch('stepData', {
      step: 1,
      data: { documents }
    });
  }

  function updateDocumentDescription(documentId: string | number, description: string) {
    documents = documents.map(doc => 
      doc.id === documentId ? { ...doc, description } : doc
    );
    
    dispatch('stepData', {
      step: 1,
      data: { documents }
    });
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getDocumentTypeInfo(type: string) {
    return documentTypes.find(dt => dt.type === type) || documentTypes[documentTypes.length - 1];
  }
</script>

<div class="space-y-6">
  
  <!-- Instructions -->
  <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
    <h4 class="text-blue-300 font-semibold mb-2">📋 Document Requirements</h4>
    <p class="text-blue-200 text-sm mb-3">
      Please upload documents that prove you own this gear. This helps protect against stolen goods and builds renter confidence.
    </p>
    
    <div class="space-y-2">
      <p class="text-blue-200 text-sm font-medium">Recommended for ${gearValue.toLocaleString()} items:</p>
      <ul class="text-blue-200 text-sm space-y-1 ml-4">
        {#each recommendedTypes as type}
          {@const typeInfo = getDocumentTypeInfo(type)}
          <li>• {typeInfo.label} - {typeInfo.description}</li>
        {/each}
      </ul>
    </div>
  </div>

  <!-- Upload Area -->
  <div 
    class="border-2 border-dashed border-white/30 rounded-lg p-8 text-center transition-colors {dragOver ? 'border-blue-400 bg-blue-500/10' : ''} {!canAddMore ? 'opacity-50 pointer-events-none' : ''}"
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
  >
    {#if uploading}
      <div class="flex flex-col items-center">
        <div class="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mb-4"></div>
        <p class="text-white">Uploading document...</p>
        {#if uploadProgress > 0}
          <div class="w-full max-w-xs bg-white/20 rounded-full h-2 mt-2">
            <div class="bg-blue-400 h-2 rounded-full transition-all" style="width: {uploadProgress}%"></div>
          </div>
        {/if}
      </div>
    {:else if canAddMore}
      <div class="flex flex-col items-center">
        <svg class="w-12 h-12 text-white/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p class="text-white mb-2">
          {documents.length === 0 ? 'Upload proof of ownership documents' : 'Add more documents'}
        </p>
        <label class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors">
          Choose Files
          <input type="file" multiple accept="image/*,.pdf" class="hidden" on:change={handleFileSelect} />
        </label>
        <p class="text-gray-400 text-xs mt-2">
          {documents.length}/{MAX_DOCUMENTS} documents • Images & PDFs • Maximum 10MB each
        </p>
      </div>
    {:else}
      <div class="text-gray-400">
        <p>Maximum number of documents reached ({MAX_DOCUMENTS})</p>
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
      <p class="text-red-300 text-sm">{error}</p>
    </div>
  {/if}

  <!-- Document List -->
  {#if documents.length > 0}
    <div>
      <h4 class="text-white font-semibold mb-4">
        Uploaded Documents ({documents.length}/{MAX_DOCUMENTS})
      </h4>
      <div class="space-y-4">
        {#each documents as document}
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
            <div class="flex items-start space-x-4">
              <!-- Document Preview -->
              <div class="flex-shrink-0">
                {#if document.file.type.startsWith('image/')}
                  <img 
                    src={document.preview} 
                    alt="Document preview" 
                    class="w-16 h-16 object-cover rounded border border-white/20"
                  />
                {:else}
                  <div class="w-16 h-16 bg-red-500/20 rounded border border-red-500/30 flex items-center justify-center">
                    <span class="text-red-300 text-xs">PDF</span>
                  </div>
                {/if}
              </div>
              
              <!-- Document Details -->
              <div class="flex-1 space-y-3">
                <!-- File Info -->
                <div>
                  <p class="text-white font-medium">{document.name}</p>
                  <p class="text-gray-400 text-sm">{formatFileSize(document.size)}</p>
                </div>
                
                <!-- Document Type Selection -->
                <div>
                  <label class="block text-sm font-medium text-white mb-2">
                    Document Type *
                  </label>
                  <select
                    bind:value={document.type}
                    on:change={(e) => updateDocumentType(document.id, e.target?.value)}
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    {#each documentTypes as type}
                      <option value={type.type}>{type.icon} {type.label}</option>
                    {/each}
                  </select>
                </div>
                
                <!-- Description (required for "other" type) -->
                {#if document.type === 'other'}
                  <div>
                    <label class="block text-sm font-medium text-white mb-2">
                      Description *
                    </label>
                    <textarea
                      bind:value={document.description}
                      on:input={(e) => updateDocumentDescription(document.id, e.target?.value)}
                      placeholder="Please describe what this document proves..."
                      rows="2"
                      class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-vertical"
                    ></textarea>
                  </div>
                {/if}
              </div>
              
              <!-- Remove Button -->
              <button 
                on:click={() => removeDocument(document.id)}
                class="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Document Type Guide -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
    <h4 class="text-white font-semibold mb-3">Document Type Guide</h4>
    <div class="grid md:grid-cols-2 gap-3">
      {#each documentTypes.slice(0, 4) as type}
        <div class="bg-white/5 rounded-lg p-3">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-lg">{type.icon}</span>
            <span class="text-white text-sm font-medium">{type.label}</span>
          </div>
          <p class="text-gray-300 text-xs">{type.description}</p>
        </div>
      {/each}
    </div>
  </div>

</div>
