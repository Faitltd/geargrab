<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let gearTitle: string;
  export let gearValue: number;
  export let documents: any[];
  export let requirement: any;
  export let processing: boolean = false;
  export let error: string = '';

  const dispatch = createEventDispatcher();

  function handleSubmit() {
    dispatch('submit');
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getDocumentTypeLabel(type: string): string {
    const types = {
      'receipt': '🧾 Purchase Receipt',
      'warranty': '📜 Warranty Documentation',
      'insurance': '🛡️ Insurance Documentation',
      'serial_number': '🔢 Serial Number Photo',
      'manual': '📖 Owner\'s Manual',
      'other': '📄 Other Documentation'
    };
    return types[type] || '📄 Document';
  }

  function getEstimatedProcessingTime(): string {
    const now = new Date();
    const businessHours = now.getHours() >= 9 && now.getHours() < 17;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    if (businessHours && isWeekday) {
      return '2-4 hours';
    } else {
      return '4-24 hours';
    }
  }

  $: totalFileSize = documents.reduce((sum, doc) => sum + doc.size, 0);
</script>

<div class="space-y-6">
  
  <!-- Submission Summary -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <h4 class="text-white font-semibold mb-4">Ownership Proof Summary</h4>
    
    <div class="space-y-4">
      <!-- Gear Information -->
      <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <p class="text-white font-medium">{gearTitle}</p>
          <p class="text-gray-400 text-sm">Estimated Value: ${gearValue.toLocaleString()}</p>
        </div>
        <div class="text-right">
          <p class="text-green-400 font-medium">Proof Required</p>
          <p class="text-gray-400 text-sm">{requirement.reason}</p>
        </div>
      </div>

      <!-- Documents Summary -->
      <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span class="text-blue-400">📄</span>
          </div>
          <div>
            <p class="text-white font-medium">Documents Uploaded</p>
            <p class="text-gray-400 text-sm">{documents.length} document{documents.length !== 1 ? 's' : ''} • {formatFileSize(totalFileSize)}</p>
          </div>
        </div>
        <span class="text-green-400">✓</span>
      </div>
    </div>
  </div>

  <!-- Document List -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <h4 class="text-white font-semibold mb-4">Documents to Submit</h4>
    
    <div class="space-y-3">
      {#each documents as document, index}
        <div class="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
          <!-- Document Preview -->
          <div class="flex-shrink-0">
            {#if document.file.type.startsWith('image/')}
              <img 
                src={document.preview} 
                alt="Document preview" 
                class="w-12 h-12 object-cover rounded border border-white/20"
              />
            {:else}
              <div class="w-12 h-12 bg-red-500/20 rounded border border-red-500/30 flex items-center justify-center">
                <span class="text-red-300 text-xs">PDF</span>
              </div>
            {/if}
          </div>
          
          <!-- Document Info -->
          <div class="flex-1">
            <p class="text-white font-medium">{getDocumentTypeLabel(document.type)}</p>
            <p class="text-gray-400 text-sm">{document.name} • {formatFileSize(document.size)}</p>
            {#if document.description}
              <p class="text-gray-300 text-xs mt-1">{document.description}</p>
            {/if}
          </div>
          
          <!-- Status -->
          <div class="flex-shrink-0">
            <span class="text-green-400 text-sm">Ready</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- What Happens Next -->
  <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
    <h4 class="text-blue-300 font-semibold mb-2">What Happens Next?</h4>
    <div class="space-y-3 text-blue-200 text-sm">
      <div class="flex items-start space-x-3">
        <span class="text-blue-400 mt-0.5">1.</span>
        <div>
          <p class="font-medium">Document Review</p>
          <p class="text-blue-300">Our team will review your ownership documentation</p>
        </div>
      </div>
      
      <div class="flex items-start space-x-3">
        <span class="text-blue-400 mt-0.5">2.</span>
        <div>
          <p class="font-medium">Verification Process</p>
          <p class="text-blue-300">We'll verify the authenticity and validity of your documents</p>
        </div>
      </div>
      
      <div class="flex items-start space-x-3">
        <span class="text-blue-400 mt-0.5">3.</span>
        <div>
          <p class="font-medium">Listing Approval</p>
          <p class="text-blue-300">Once approved, your listing will be published and available for rent</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Processing Time -->
  <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
    <div class="flex items-center">
      <span class="text-green-400 mr-3">⏱️</span>
      <div>
        <p class="text-green-300 font-medium">Estimated Processing Time</p>
        <p class="text-green-200 text-sm">
          {getEstimatedProcessingTime()} during business hours
        </p>
      </div>
    </div>
  </div>

  <!-- Terms and Conditions -->
  <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
    <h4 class="text-yellow-300 font-semibold mb-2">Important Information</h4>
    <div class="text-yellow-200 text-sm space-y-2">
      <p>By submitting this ownership proof:</p>
      <ul class="ml-4 space-y-1">
        <li>• You confirm that all documents are authentic and unaltered</li>
        <li>• You certify that you are the legal owner of the gear</li>
        <li>• You understand that false documentation may result in account suspension</li>
        <li>• You consent to verification of the provided documentation</li>
        <li>• You agree that GearGrab may contact you for additional verification if needed</li>
      </ul>
    </div>
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
      <div class="flex items-start">
        <span class="text-red-400 mr-3 mt-0.5">❌</span>
        <div>
          <p class="text-red-300 font-medium">Submission Error</p>
          <p class="text-red-200 text-sm mt-1">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Submit Button -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-center">
    {#if processing}
      <div class="flex flex-col items-center">
        <div class="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mb-4"></div>
        <h4 class="text-white font-semibold mb-2">Submitting Ownership Proof</h4>
        <p class="text-gray-300 text-sm">Please wait while we process your submission...</p>
      </div>
    {:else}
      <div>
        <h4 class="text-white font-semibold mb-2">Ready to Submit</h4>
        <p class="text-gray-300 text-sm mb-6">
          Your ownership proof is complete and ready for review. Click below to submit.
        </p>
        
        <button
          on:click={handleSubmit}
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-lg"
        >
          🚀 Submit Ownership Proof
        </button>
        
        <p class="text-gray-400 text-xs mt-3">
          This will submit your documents for verification review
        </p>
      </div>
    {/if}
  </div>

  <!-- Support Information -->
  <div class="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
    <h4 class="text-gray-300 font-semibold mb-2">Need Help?</h4>
    <p class="text-gray-400 text-sm mb-2">
      If you have questions about the ownership verification process:
    </p>
    <div class="flex space-x-4 text-sm">
      <a href="/faq#ownership" class="text-blue-400 hover:text-blue-300 underline">
        Ownership FAQ
      </a>
      <a href="/contact" class="text-blue-400 hover:text-blue-300 underline">
        Contact Support
      </a>
    </div>
  </div>

</div>
