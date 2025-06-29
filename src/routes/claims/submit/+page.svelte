<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { firestore } from '$lib/firebase/client';
  import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
  import { notifications } from '$lib/stores/notifications';
  import AuthGuard from '$lib/components/auth/auth-guard.svelte';

  let loading = true;
  let submitting = false;
  let bookingId = '';
  let booking: any = null;
  let listing: any = null;

  // Form data
  let claimData = {
    type: 'damage' as 'damage' | 'theft' | 'loss',
    description: '',
    incidentDate: '',
    estimatedCost: 0,
    photos: [] as File[],
    documents: [] as File[],
    witnessStatement: ''
  };

  let errors: Record<string, string> = {};

  onMount(async () => {
    // Get booking ID from URL params
    bookingId = $page.url.searchParams.get('booking') || '';
    
    if (!bookingId) {
      notifications.add({
        type: 'error',
        message: 'Booking ID is required to submit a claim',
        timeout: 5000
      });
      goto('/dashboard');
      return;
    }

    await loadBookingData();
  });

  async function loadBookingData() {
    try {
      loading = true;

      // Load booking data
      const bookingDoc = await getDoc(doc(firestore, 'bookings', bookingId));
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }

      booking = { id: bookingDoc.id, ...bookingDoc.data() };

      // Load listing data
      const listingDoc = await getDoc(doc(firestore, 'listings', booking.listingId));
      if (listingDoc.exists()) {
        listing = { id: listingDoc.id, ...listingDoc.data() };
      }

      // Set default incident date to end date
      if (booking.endDate) {
        const endDate = booking.endDate.toDate();
        claimData.incidentDate = endDate.toISOString().split('T')[0];
      }

    } catch (error) {
      console.error('Error loading booking data:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load booking information',
        timeout: 5000
      });
      goto('/dashboard');
    } finally {
      loading = false;
    }
  }

  function validateForm(): boolean {
    errors = {};

    if (!claimData.description.trim()) {
      errors.description = 'Please describe what happened';
    }

    if (!claimData.incidentDate) {
      errors.incidentDate = 'Please specify when the incident occurred';
    }

    if (claimData.estimatedCost <= 0) {
      errors.estimatedCost = 'Please provide an estimated cost';
    }

    if (claimData.photos.length === 0) {
      errors.photos = 'Please upload at least one photo of the damage';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      submitting = true;

      // Create claim data
      const claim = {
        bookingId,
        listingId: booking.listingId,
        claimantId: simpleAuth.user?.uid,
        respondentId: booking.ownerUid === simpleAuth.user?.uid ? booking.renterUid : booking.ownerUid,
        type: claimData.type,
        status: 'submitted',
        description: claimData.description.trim(),
        incidentDate: new Date(claimData.incidentDate),
        reportedDate: new Date(),
        estimatedCost: claimData.estimatedCost,
        evidence: {
          photos: [], // Will be populated after file upload
          documents: [],
          witnessStatements: claimData.witnessStatement ? [claimData.witnessStatement] : []
        },
        timeline: [{
          date: serverTimestamp(),
          action: 'Claim submitted',
          actor: simpleAuth.user?.uid,
          notes: 'Initial claim submission via web form'
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Submit claim
      const claimRef = await addDoc(collection(firestore, 'insuranceClaims'), claim);

      notifications.add({
        type: 'success',
        message: 'Claim submitted successfully! We will review it within 48 hours.',
        timeout: 8000
      });

      // Redirect to claim status page
      goto(`/claims/${claimRef.id}`);

    } catch (error) {
      console.error('Error submitting claim:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to submit claim. Please try again.',
        timeout: 5000
      });
    } finally {
      submitting = false;
    }
  }

  function handlePhotoUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      claimData.photos = Array.from(target.files);
      errors.photos = '';
    }
  }

  function handleDocumentUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      claimData.documents = Array.from(target.files);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Submit Insurance Claim - GearGrab</title>
</svelte:head>

<AuthGuard>
  <div class="max-w-4xl mx-auto px-4 py-8">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        <span class="ml-3 text-gray-300">Loading booking information...</span>
      </div>
    {:else}
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Submit Insurance Claim</h1>
        <p class="text-gray-400">Report damage, theft, or loss for your rental</p>
      </div>

      <!-- Booking Summary -->
      {#if booking && listing}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h2 class="text-xl font-semibold text-white mb-4">Rental Information</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-white font-medium mb-2">{listing.title}</h3>
              <div class="space-y-1 text-sm text-gray-300">
                <div>Booking ID: {booking.id}</div>
                <div>Rental Period: {booking.startDate.toDate().toLocaleDateString()} - {booking.endDate.toDate().toLocaleDateString()}</div>
                <div>Total Paid: {formatCurrency(booking.totalPrice)}</div>
                <div>Status: <span class="capitalize">{booking.status}</span></div>
              </div>
            </div>
            <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 class="text-green-400 font-medium mb-2">🛡️ Your Coverage</h4>
              <div class="text-sm text-green-200 space-y-1">
                <div>• Standard Coverage included</div>
                <div>• Up to 50% repair cost coverage</div>
                <div>• Maximum liability: $200</div>
                <div>• 48-hour claim window</div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Claim Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-8">
        <!-- Claim Type -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-xl font-semibold text-white mb-4">Claim Type</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each [
              { value: 'damage', label: 'Damage', icon: '🔧', desc: 'Physical damage to the equipment' },
              { value: 'theft', label: 'Theft', icon: '🚨', desc: 'Equipment was stolen' },
              { value: 'loss', label: 'Loss', icon: '❓', desc: 'Equipment was lost or misplaced' }
            ] as option}
              <label class="relative">
                <input
                  type="radio"
                  bind:group={claimData.type}
                  value={option.value}
                  class="sr-only"
                />
                <div class="border-2 rounded-lg p-4 cursor-pointer transition-all {claimData.type === option.value ? 'border-green-500 bg-green-500/10' : 'border-white/20 hover:border-white/40'}">
                  <div class="text-center">
                    <div class="text-2xl mb-2">{option.icon}</div>
                    <div class="text-white font-medium">{option.label}</div>
                    <div class="text-gray-400 text-sm mt-1">{option.desc}</div>
                  </div>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <!-- Incident Details -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-xl font-semibold text-white mb-4">Incident Details</h3>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label for="incidentDate" class="block text-white font-medium mb-2">When did this occur? *</label>
              <input
                id="incidentDate"
                type="date"
                bind:value={claimData.incidentDate}
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                class:border-red-500={errors.incidentDate}
                required
              />
              {#if errors.incidentDate}
                <p class="text-red-400 text-sm mt-1">{errors.incidentDate}</p>
              {/if}
            </div>

            <div>
              <label for="estimatedCost" class="block text-white font-medium mb-2">Estimated Cost * ($)</label>
              <input
                id="estimatedCost"
                type="number"
                min="0"
                step="0.01"
                bind:value={claimData.estimatedCost}
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                class:border-red-500={errors.estimatedCost}
                placeholder="0.00"
                required
              />
              {#if errors.estimatedCost}
                <p class="text-red-400 text-sm mt-1">{errors.estimatedCost}</p>
              {/if}
            </div>
          </div>

          <div class="mt-6">
            <label for="description" class="block text-white font-medium mb-2">Description *</label>
            <textarea
              id="description"
              bind:value={claimData.description}
              rows="4"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              class:border-red-500={errors.description}
              placeholder="Please describe what happened in detail..."
              required
            ></textarea>
            {#if errors.description}
              <p class="text-red-400 text-sm mt-1">{errors.description}</p>
            {/if}
          </div>
        </div>

        <!-- Evidence -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-xl font-semibold text-white mb-4">Evidence</h3>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label for="photos" class="block text-white font-medium mb-2">Photos * (Required)</label>
              <input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                on:change={handlePhotoUpload}
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
                class:border-red-500={errors.photos}
              />
              {#if errors.photos}
                <p class="text-red-400 text-sm mt-1">{errors.photos}</p>
              {/if}
              <p class="text-gray-400 text-sm mt-1">Upload clear photos showing the damage or issue</p>
            </div>

            <div>
              <label for="documents" class="block text-white font-medium mb-2">Supporting Documents</label>
              <input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                on:change={handleDocumentUpload}
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
              />
              <p class="text-gray-400 text-sm mt-1">Police reports, repair estimates, etc.</p>
            </div>
          </div>

          <div class="mt-6">
            <label for="witnessStatement" class="block text-white font-medium mb-2">Witness Statement</label>
            <textarea
              id="witnessStatement"
              bind:value={claimData.witnessStatement}
              rows="3"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="If anyone witnessed the incident, please provide their statement..."
            ></textarea>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex justify-between items-center">
          <a
            href="/dashboard"
            class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </a>
          
          <button
            type="submit"
            disabled={submitting}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            {#if submitting}
              <div class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Claim...
              </div>
            {:else}
              Submit Claim
            {/if}
          </button>
        </div>
      </form>

      <!-- Help Section -->
      <div class="mt-12 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h3 class="text-blue-400 font-semibold mb-3">Need Help?</h3>
        <div class="text-blue-200 text-sm space-y-2">
          <p>• Claims must be submitted within 48 hours of the incident</p>
          <p>• Include clear photos and detailed descriptions for faster processing</p>
          <p>• We typically respond to claims within 1-2 business days</p>
          <p>• Contact support at <a href="mailto:claims@geargrab.co" class="text-blue-400 hover:text-blue-300">claims@geargrab.co</a> for urgent matters</p>
        </div>
      </div>
    {/if}
  </div>
</AuthGuard>
