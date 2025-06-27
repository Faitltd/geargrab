<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { getGuide, createGuideBooking } from '$lib/firebase/db/guides';
  import { toastNotifications } from '$lib/stores/notifications';
  import type { Guide } from '$lib/types/firestore';
  import { GUIDE_SPECIALTIES, GUIDE_SERVICE_TYPES, GUIDE_SKILL_LEVELS, SUCCESS_MESSAGES } from '$lib/constants';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';

  let guide: Guide | null = null;
  let loading = true;
  let bookingLoading = false;
  let error: string | null = null;

  let showBookingForm = false;

  $: authState = simpleAuth.authState;
  $: guideId = $page.params.id;

  // Booking form data
  let bookingData = {
    serviceDate: '',
    startTime: '09:00',
    endTime: '17:00',
    duration: 8,
    serviceType: 'instruction',
    specialty: '',
    groupSize: 1,
    skillLevel: 'beginner',
    locationType: 'guide_location',
    locationAddress: '',
    locationDetails: '',
    specialRequests: ''
  };

  let bookingErrors: Record<string, string> = {};

  onMount(async () => {
    await loadGuide();
  });

  async function loadGuide() {
    try {
      loading = true;
      error = null;

      if (!guideId) {
        error = 'Guide ID not found';
        return;
      }

      guide = await getGuide(guideId);
      
      if (!guide) {
        error = 'Guide not found';
        return;
      }

      // Set default specialty for booking
      if (guide.specialties.length > 0) {
        bookingData.specialty = guide.specialties[0];
      }

    } catch (err) {
      console.error('Error loading guide:', err);
      error = 'Failed to load guide profile. Please try again.';
    } finally {
      loading = false;
    }
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getSpecialtyName(specialtyId: string): string {
    const specialty = GUIDE_SPECIALTIES.find(s => s.id === specialtyId);
    return specialty?.name || specialtyId;
  }

  function getSpecialtyIcon(specialtyId: string): string {
    const specialty = GUIDE_SPECIALTIES.find(s => s.id === specialtyId);
    return specialty?.icon || '🎯';
  }

  function getServiceTypeName(serviceType: string): string {
    const service = GUIDE_SERVICE_TYPES.find(s => s.value === serviceType);
    return service?.label || serviceType;
  }

  function getSkillLevelName(skillLevel: string): string {
    const skill = GUIDE_SKILL_LEVELS.find(s => s.value === skillLevel);
    return skill?.label || skillLevel;
  }

  function getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }

  function calculateDuration() {
    if (bookingData.startTime && bookingData.endTime) {
      const start = new Date(`2000-01-01T${bookingData.startTime}`);
      const end = new Date(`2000-01-01T${bookingData.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      bookingData.duration = Math.max(1, Math.round(diffHours));
    }
  }

  function calculateTotalPrice(): number {
    if (!guide) return 0;
    
    let basePrice = guide.hourlyRate * bookingData.duration;
    
    // Add travel fee if applicable
    if (bookingData.locationType === 'client_location' && guide.serviceArea.travelFee) {
      basePrice += guide.serviceArea.travelFee;
    }
    
    return basePrice;
  }

  function validateBookingForm(): boolean {
    bookingErrors = {};
    let isValid = true;

    if (!bookingData.serviceDate) {
      bookingErrors.serviceDate = 'Service date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(bookingData.serviceDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        bookingErrors.serviceDate = 'Service date cannot be in the past';
        isValid = false;
      }
      
      if (guide?.availability.advanceBooking) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + guide.availability.advanceBooking);
        minDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < minDate) {
          bookingErrors.serviceDate = `Booking requires ${guide.availability.advanceBooking} days advance notice`;
          isValid = false;
        }
      }
    }

    if (bookingData.groupSize < 1 || bookingData.groupSize > 20) {
      bookingErrors.groupSize = 'Group size must be between 1 and 20';
      isValid = false;
    }

    if (bookingData.locationType === 'client_location' && !bookingData.locationAddress.trim()) {
      bookingErrors.locationAddress = 'Location address is required for client location';
      isValid = false;
    }

    return isValid;
  }

  async function handleBookingSubmit() {
    if (!validateBookingForm()) {
      return;
    }

    if (!$authState.user) {
      toastNotifications.error('You must be logged in to book a guide');
      goto('/auth/login?redirect=' + encodeURIComponent($page.url.pathname));
      return;
    }

    if (!guide) {
      toastNotifications.error('Guide information not available');
      return;
    }

    bookingLoading = true;

    try {
      const serviceDate = new Date(bookingData.serviceDate + 'T' + bookingData.startTime);

      // Convert to Firestore Timestamp
      const { Timestamp } = await import('firebase/firestore');
      const firestoreTimestamp = Timestamp.fromDate(serviceDate);
      
      const booking = {
        guideId: guide.guideId,
        guideName: guide.displayName,
        guideImage: guide.images[0] || '',
        guideUid: guide.guideUid,
        clientId: $authState.user.uid,
        clientUid: $authState.user.uid,
        serviceDate: firestoreTimestamp,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        duration: bookingData.duration,
        serviceType: bookingData.serviceType as 'instruction' | 'guided_tour' | 'consultation' | 'equipment_demo' | 'custom',
        specialty: bookingData.specialty,
        location: {
          type: bookingData.locationType as 'guide_location' | 'client_location' | 'meet_point',
          address: bookingData.locationAddress || undefined,
          details: bookingData.locationDetails || undefined
        },
        groupSize: bookingData.groupSize,
        skillLevel: bookingData.skillLevel as 'beginner' | 'intermediate' | 'advanced' | 'mixed',
        specialRequests: bookingData.specialRequests || undefined,
        totalPrice: calculateTotalPrice(),
        hourlyRate: guide.hourlyRate,
        travelFee: (bookingData.locationType === 'client_location' && guide.serviceArea.travelFee) ? guide.serviceArea.travelFee : undefined,
        paymentStatus: 'pending' as 'pending' | 'paid' | 'refunded',
        status: 'pending' as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
      };

      await createGuideBooking(booking);
      
      toastNotifications.success(SUCCESS_MESSAGES.GUIDE_BOOKING_CREATED);
      showBookingForm = false;
      
      // Reset form
      bookingData = {
        serviceDate: '',
        startTime: '09:00',
        endTime: '17:00',
        duration: 8,
        serviceType: 'instruction',
        specialty: guide.specialties[0] || '',
        groupSize: 1,
        skillLevel: 'beginner',
        locationType: 'guide_location',
        locationAddress: '',
        locationDetails: '',
        specialRequests: ''
      };
      
    } catch (error) {
      console.error('Error creating guide booking:', error);
      toastNotifications.error('Failed to create booking. Please try again.');
    } finally {
      bookingLoading = false;
    }
  }

  // Reactive calculations
  $: {
    calculateDuration();
  }
</script>

<svelte:head>
  <title>{guide ? `${guide.displayName} - Expert Guide` : 'Guide Profile'} - GearGrab</title>
  <meta name="description" content={guide ? `Book ${guide.displayName}, an expert outdoor guide specializing in ${guide.specialties.map(s => getSpecialtyName(s)).join(', ')}` : 'Expert outdoor guide profile'} />
</svelte:head>

<!-- Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
/>

{#if loading}
  <section class="relative min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
  </section>
{:else if error}
  <section class="relative min-h-screen flex items-center justify-center text-center text-white">
    <div class="max-w-md mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">Guide Not Found</h1>
      <p class="text-white/70 mb-6">{error}</p>
      <a href="/browse-guides" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
        Browse Other Guides
      </a>
    </div>
  </section>
{:else if guide}
  <!-- Hero Section -->
  <ScrollLinkedAnimator>
    <section class="relative min-h-[60vh] flex items-center justify-center text-white">
      <div class="relative z-10 max-w-6xl mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <!-- Guide Info -->
          <div>
            <div class="flex items-center gap-4 mb-4">
              <div class="w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full flex items-center justify-center">
                <span class="text-3xl">👨‍🏫</span>
              </div>
              <div>
                <h1 class="text-3xl md:text-4xl font-bold">{guide.displayName}</h1>
                <div class="flex items-center gap-2 mt-1">
                  {#if guide.isVerified}
                    <span class="px-2 py-1 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/30">
                      ✓ Verified Guide
                    </span>
                  {/if}
                  <span class="text-white/70">{guide.experience}</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-4 mb-4">
              <div class="flex items-center gap-1">
                <span class="text-yellow-400 text-lg">{getRatingStars(guide.avgRating || 0)}</span>
                <span class="text-white/70">({guide.reviewCount || 0} reviews)</span>
              </div>
              <span class="text-white/70">📍 {guide.location.city}, {guide.location.state}</span>
            </div>
            
            <p class="text-lg text-white/90 mb-6">{guide.bio}</p>
            
            <!-- Rates -->
            <div class="flex items-center gap-6 mb-6">
              <div>
                <span class="text-2xl font-bold text-green-400">{formatPrice(guide.hourlyRate)}</span>
                <span class="text-white/70">/hour</span>
              </div>
              {#if guide.dayRate}
                <div>
                  <span class="text-xl font-bold text-green-400">{formatPrice(guide.dayRate)}</span>
                  <span class="text-white/70">/day</span>
                </div>
              {/if}
            </div>
            
            <!-- Book Button -->
            <button
              on:click={() => showBookingForm = !showBookingForm}
              class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center text-lg"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Book This Guide
            </button>
          </div>
          
          <!-- Quick Stats -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-white">{guide.totalBookings || 0}</div>
              <div class="text-white/70 text-sm">Sessions</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-white">{guide.responseTime}</div>
              <div class="text-white/70 text-sm">Response Time</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-white">{guide.serviceArea.radius} mi</div>
              <div class="text-white/70 text-sm">Service Radius</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-white">{guide.languages.length}</div>
              <div class="text-white/70 text-sm">Languages</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </ScrollLinkedAnimator>

  <!-- Booking Form Modal -->
  {#if showBookingForm}
    <section class="relative py-8">
      <div class="max-w-4xl mx-auto px-4">
        <div class="bg-black/40 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Book {guide.displayName}</h2>
            <button
              on:click={() => showBookingForm = false}
              class="text-white/70 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <form on:submit|preventDefault={handleBookingSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Service Date -->
              <FormField
                id="serviceDate"
                label="Service Date"
                type="date"
                bind:value={bookingData.serviceDate}
                error={bookingErrors.serviceDate}
                required
              />

              <!-- Service Type -->
              <FormField
                id="serviceType"
                label="Service Type"
                type="select"
                bind:value={bookingData.serviceType}
                required
              >
                {#each GUIDE_SERVICE_TYPES as serviceType}
                  <option value={serviceType.value}>{serviceType.label}</option>
                {/each}
              </FormField>

              <!-- Start Time -->
              <FormField
                id="startTime"
                label="Start Time"
                type="time"
                bind:value={bookingData.startTime}
                required
              />

              <!-- End Time -->
              <FormField
                id="endTime"
                label="End Time"
                type="time"
                bind:value={bookingData.endTime}
                required
              />

              <!-- Specialty -->
              <FormField
                id="specialty"
                label="Specialty"
                type="select"
                bind:value={bookingData.specialty}
                required
              >
                {#each guide.specialties as specialty}
                  <option value={specialty}>{getSpecialtyIcon(specialty)} {getSpecialtyName(specialty)}</option>
                {/each}
              </FormField>

              <!-- Group Size -->
              <FormField
                id="groupSize"
                label="Group Size"
                type="number"
                bind:value={bookingData.groupSize}
                placeholder="1"
                error={bookingErrors.groupSize}
                required
              />

              <!-- Skill Level -->
              <FormField
                id="skillLevel"
                label="Skill Level"
                type="select"
                bind:value={bookingData.skillLevel}
                required
              >
                {#each GUIDE_SKILL_LEVELS as skillLevel}
                  <option value={skillLevel.value}>{skillLevel.label}</option>
                {/each}
              </FormField>

              <!-- Location Type -->
              <FormField
                id="locationType"
                label="Meeting Location"
                type="select"
                bind:value={bookingData.locationType}
                required
              >
                <option value="guide_location">Guide's Location</option>
                <option value="client_location">My Location</option>
                <option value="meet_point">Meet at Specific Point</option>
              </FormField>
            </div>

            <!-- Location Details -->
            {#if bookingData.locationType !== 'guide_location'}
              <FormField
                id="locationAddress"
                label="Location Address"
                type="text"
                bind:value={bookingData.locationAddress}
                placeholder="Enter address or meeting point"
                error={bookingErrors.locationAddress}
                required={bookingData.locationType === 'client_location'}
              />
            {/if}

            <FormField
              id="locationDetails"
              label="Location Details (Optional)"
              type="textarea"
              bind:value={bookingData.locationDetails}
              placeholder="Any specific details about the location or meeting point..."
            />

            <!-- Special Requests -->
            <FormField
              id="specialRequests"
              label="Special Requests (Optional)"
              type="textarea"
              bind:value={bookingData.specialRequests}
              placeholder="Any special requests, goals, or things the guide should know..."
            />

            <!-- Booking Summary -->
            <div class="bg-white/10 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3">Booking Summary</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-white/70">Duration:</span>
                  <span class="text-white">{bookingData.duration} hours</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/70">Service:</span>
                  <span class="text-white">{getServiceTypeName(bookingData.serviceType)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/70">Specialty:</span>
                  <span class="text-white">{getSpecialtyName(bookingData.specialty)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/70">Group Size:</span>
                  <span class="text-white">{bookingData.groupSize} {bookingData.groupSize === 1 ? 'person' : 'people'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/70">Skill Level:</span>
                  <span class="text-white">{getSkillLevelName(bookingData.skillLevel)}</span>
                </div>
                <hr class="border-white/20 my-2">
                <div class="flex justify-between">
                  <span class="text-white/70">Base Rate ({bookingData.duration}h × {formatPrice(guide.hourlyRate)}):</span>
                  <span class="text-white">{formatPrice(guide.hourlyRate * bookingData.duration)}</span>
                </div>
                {#if bookingData.locationType === 'client_location' && guide.serviceArea.travelFee}
                  <div class="flex justify-between">
                    <span class="text-white/70">Travel Fee:</span>
                    <span class="text-white">{formatPrice(guide.serviceArea.travelFee)}</span>
                  </div>
                {/if}
                <hr class="border-white/20 my-2">
                <div class="flex justify-between text-lg font-semibold">
                  <span class="text-white">Total:</span>
                  <span class="text-green-400">{formatPrice(calculateTotalPrice())}</span>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <FormButton
              type="submit"
              loading={bookingLoading}
              disabled={bookingLoading}
              fullWidth={true}
            >
              {bookingLoading ? 'Creating Booking...' : 'Request Booking'}
            </FormButton>
          </form>
        </div>
      </div>
    </section>
  {/if}

  <!-- Guide Details Sections -->
  <section class="relative py-16">
    <div class="max-w-6xl mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Specialties -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-xl font-bold text-white mb-4">Specialties</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              {#each guide.specialties as specialty}
                <div class="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-center">
                  <div class="text-2xl mb-1">{getSpecialtyIcon(specialty)}</div>
                  <div class="text-sm">{getSpecialtyName(specialty)}</div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Certifications -->
          {#if guide.certifications.length > 0}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 class="text-xl font-bold text-white mb-4">Certifications</h3>
              <div class="space-y-2">
                {#each guide.certifications as cert}
                  <div class="flex items-center gap-2">
                    <span class="text-green-400">✓</span>
                    <span class="text-white">{cert}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Equipment Provided -->
          {#if guide.equipment && guide.equipment.length > 0}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 class="text-xl font-bold text-white mb-4">Equipment Provided</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                {#each guide.equipment as item}
                  <div class="flex items-center gap-2">
                    <span class="text-green-400">•</span>
                    <span class="text-white">{item}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Languages -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-xl font-bold text-white mb-4">Languages</h3>
            <div class="flex flex-wrap gap-2">
              {#each guide.languages as language}
                <span class="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  {language}
                </span>
              {/each}
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Availability -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-bold text-white mb-4">Availability</h3>
            <div class="space-y-3">
              <div>
                <span class="text-white/70 text-sm">Days Available:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  {#each guide.availability.daysOfWeek as day}
                    <span class="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded capitalize">
                      {day.slice(0, 3)}
                    </span>
                  {/each}
                </div>
              </div>

              <div>
                <span class="text-white/70 text-sm">Time Slots:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  {#each guide.availability.timeSlots as slot}
                    <span class="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded capitalize">
                      {slot.replace('_', ' ')}
                    </span>
                  {/each}
                </div>
              </div>

              <div>
                <span class="text-white/70 text-sm">Advance Booking:</span>
                <span class="text-white ml-2">{guide.availability.advanceBooking} days minimum</span>
              </div>
            </div>
          </div>

          <!-- Service Area -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-bold text-white mb-4">Service Area</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-white/70">Radius:</span>
                <span class="text-white">{guide.serviceArea.radius} miles</span>
              </div>
              {#if guide.serviceArea.travelFee}
                <div class="flex justify-between">
                  <span class="text-white/70">Travel Fee:</span>
                  <span class="text-white">{formatPrice(guide.serviceArea.travelFee)}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Contact Info -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-bold text-white mb-4">Response Time</h3>
            <p class="text-white">{guide.responseTime}</p>

            <button
              on:click={() => showBookingForm = true}
              class="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
{/if}
