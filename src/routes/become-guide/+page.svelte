<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { toastNotifications } from '$lib/stores/notifications';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import FormContainer from '$lib/components/forms/form-container.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';

  // Get the auth state store
  $: authState = simpleAuth.authState;

  // Import constants dynamically to avoid SSR issues
  let GUIDE_SPECIALTIES: any[] = [];
  let SUCCESS_MESSAGES: any = {};

  onMount(async () => {
    if (browser) {
      const constants = await import('$lib/constants');
      GUIDE_SPECIALTIES = [...constants.GUIDE_SPECIALTIES];
      SUCCESS_MESSAGES = {...constants.SUCCESS_MESSAGES};
    }
  });

  let loading = false;
  let errors: Record<string, string> = {};

  // Form data for guide profile
  let formData = {
    displayName: '',
    bio: '',
    specialties: [] as string[],
    certifications: [] as string[],
    experience: '',
    hourlyRate: 0,
    dayRate: 0,
    city: '',
    state: '',
    zipCode: '',
    serviceRadius: 25,
    travelFee: 0,
    daysOfWeek: [] as string[],
    timeSlots: [] as string[],
    advanceBooking: 1,
    languages: [] as string[],
    equipment: [] as string[],
    responseTime: 'within 24 hours'
  };

  // Available options
  const daysOfWeekOptions = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const timeSlotOptions = [
    'early_morning', 'morning', 'afternoon', 'evening', 'night'
  ];

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin', 'Japanese'
  ];

  // Check authentication on mount
  onMount(() => {
    if (!$authState.isAuthenticated && !$authState.loading) {
      goto('/auth/login?redirect=/become-guide');
    }
  });

  // Reactive check for authentication
  $: {
    if (!$authState.loading && !$authState.isAuthenticated) {
      goto('/auth/login?redirect=/become-guide');
    }
  }

  function validateForm(): boolean {
    errors = {};
    let isValid = true;

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
      isValid = false;
    }

    if (!formData.bio.trim()) {
      errors.bio = 'Bio is required';
      isValid = false;
    }

    if (formData.specialties.length === 0) {
      errors.specialties = 'At least one specialty is required';
      isValid = false;
    }

    if (formData.hourlyRate <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than $0';
      isValid = false;
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
      isValid = false;
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
      isValid = false;
    }

    if (!formData.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
      isValid = false;
    }

    if (formData.daysOfWeek.length === 0) {
      errors.daysOfWeek = 'At least one day of availability is required';
      isValid = false;
    }

    if (formData.timeSlots.length === 0) {
      errors.timeSlots = 'At least one time slot is required';
      isValid = false;
    }

    return isValid;
  }

  function toggleSpecialty(specialtyId: string) {
    if (formData.specialties.includes(specialtyId)) {
      formData.specialties = formData.specialties.filter(s => s !== specialtyId);
    } else {
      formData.specialties = [...formData.specialties, specialtyId];
    }
  }

  function toggleDay(day: string) {
    if (formData.daysOfWeek.includes(day)) {
      formData.daysOfWeek = formData.daysOfWeek.filter(d => d !== day);
    } else {
      formData.daysOfWeek = [...formData.daysOfWeek, day];
    }
  }

  function toggleTimeSlot(slot: string) {
    if (formData.timeSlots.includes(slot)) {
      formData.timeSlots = formData.timeSlots.filter(s => s !== slot);
    } else {
      formData.timeSlots = [...formData.timeSlots, slot];
    }
  }

  function toggleLanguage(language: string) {
    if (formData.languages.includes(language)) {
      formData.languages = formData.languages.filter(l => l !== language);
    } else {
      formData.languages = [...formData.languages, language];
    }
  }

  function addCertification() {
    const input = document.getElementById('new-certification') as HTMLInputElement;
    if (input && input.value.trim()) {
      formData.certifications = [...formData.certifications, input.value.trim()];
      input.value = '';
    }
  }

  function removeCertification(index: number) {
    formData.certifications = formData.certifications.filter((_, i) => i !== index);
  }

  function addEquipment() {
    const input = document.getElementById('new-equipment') as HTMLInputElement;
    if (input && input.value.trim()) {
      formData.equipment = [...formData.equipment, input.value.trim()];
      input.value = '';
    }
  }

  function removeEquipment(index: number) {
    formData.equipment = formData.equipment.filter((_, i) => i !== index);
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    if (!$authState.user) {
      toastNotifications.error('You must be logged in to become a guide');
      return;
    }

    if (!browser) {
      toastNotifications.error('This feature is not available on the server');
      return;
    }

    loading = true;

    try {
      // Dynamic import to avoid SSR issues
      const { createGuide } = await import('$lib/firebase/db/guides');
      const guideData = {
        guideId: $authState.user.uid,
        guideUid: $authState.user.uid,
        displayName: formData.displayName,
        bio: formData.bio,
        specialties: formData.specialties,
        certifications: formData.certifications,
        experience: formData.experience,
        hourlyRate: formData.hourlyRate,
        dayRate: formData.dayRate || undefined,
        location: {
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        serviceArea: {
          radius: formData.serviceRadius,
          travelFee: formData.travelFee || undefined
        },
        availability: {
          daysOfWeek: formData.daysOfWeek,
          timeSlots: formData.timeSlots,
          advanceBooking: formData.advanceBooking
        },
        images: [],
        languages: formData.languages,
        equipment: formData.equipment,
        responseTime: formData.responseTime,
        isActive: false,
        isVerified: false,
        status: 'pending' as const
      };

      await createGuide(guideData);
      
      toastNotifications.success(SUCCESS_MESSAGES.GUIDE_PROFILE_CREATED);
      
      goto('/dashboard');
    } catch (error) {
      console.error('Error creating guide profile:', error);
      toastNotifications.error('Failed to create guide profile. Please try again.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Become a Guide - GearGrab</title>
  <meta name="description" content="Share your outdoor expertise and earn money as a guide on GearGrab" />
</svelte:head>

<!-- Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
/>

<!-- Hero Section -->
<ScrollLinkedAnimator>
  <section class="relative min-h-[50vh] flex items-center justify-center text-center text-white">
    <div class="relative z-10 max-w-4xl mx-auto px-4">
      <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
        Become an <span class="text-green-400">Expert Guide</span>
      </h1>
      <p class="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
        Share your outdoor expertise, teach others, and earn money doing what you love. Join our community of certified guides and trainers.
      </p>
    </div>
  </section>
</ScrollLinkedAnimator>

<!-- Form Section -->
<section class="relative py-16 min-h-screen">
  <div class="max-w-4xl mx-auto px-4">
    <FormContainer>
      <h2 class="text-2xl font-bold text-white mb-8 text-center">Create Your Guide Profile</h2>
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-8">
        <!-- Basic Information -->
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-white">Basic Information</h3>
          
          <FormField
            label="Display Name"
            type="text"
            bind:value={formData.displayName}
            placeholder="Your professional name"
            error={errors.displayName}
            required
          />

          <FormField
            label="Bio"
            type="textarea"
            bind:value={formData.bio}
            placeholder="Tell potential clients about your experience, passion, and what makes you a great guide..."
            error={errors.bio}
            required
          />

          <FormField
            label="Years of Experience"
            type="text"
            bind:value={formData.experience}
            placeholder="e.g., 5+ years, 10+ years"
          />
        </div>

        <!-- Specialties -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-white">Specialties</h3>
          <p class="text-white/70 text-sm">Select all activities you can guide (at least one required)</p>
          {#if errors.specialties}
            <p class="text-red-400 text-sm">{errors.specialties}</p>
          {/if}
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            {#each GUIDE_SPECIALTIES as specialty}
              <label class="flex items-center space-x-3 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.specialties.includes(specialty.id)}
                  on:change={() => toggleSpecialty(specialty.id)}
                  class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <span class="text-sm">{specialty.icon} {specialty.name}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Rates -->
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-white">Rates</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Hourly Rate ($)"
              type="number"
              bind:value={formData.hourlyRate}
              placeholder="0"
              error={errors.hourlyRate}
              required
            />
            <FormField
              label="Day Rate ($)"
              type="number"
              bind:value={formData.dayRate}
              placeholder="Optional"
            />
          </div>
        </div>

        <!-- Location & Service Area -->
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-white">Location & Service Area</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="City"
              type="text"
              bind:value={formData.city}
              placeholder="Denver"
              error={errors.city}
              required
            />
            <FormField
              label="State"
              type="text"
              bind:value={formData.state}
              placeholder="CO"
              error={errors.state}
              required
            />
            <FormField
              label="ZIP Code"
              type="text"
              bind:value={formData.zipCode}
              placeholder="80202"
              error={errors.zipCode}
              required
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Service Radius (miles)"
              type="number"
              bind:value={formData.serviceRadius}
              placeholder="25"
            />
            <FormField
              label="Travel Fee ($)"
              type="number"
              bind:value={formData.travelFee}
              placeholder="0"
            />
          </div>
        </div>

        <!-- Availability -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-white">Availability</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white mb-2">Days Available</label>
              {#if errors.daysOfWeek}
                <p class="text-red-400 text-sm mb-2">{errors.daysOfWeek}</p>
              {/if}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                {#each daysOfWeekOptions as day}
                  <label class="flex items-center space-x-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.daysOfWeek.includes(day)}
                      on:change={() => toggleDay(day)}
                      class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span class="text-sm capitalize">{day}</span>
                  </label>
                {/each}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-white mb-2">Time Slots</label>
              {#if errors.timeSlots}
                <p class="text-red-400 text-sm mb-2">{errors.timeSlots}</p>
              {/if}
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                {#each timeSlotOptions as slot}
                  <label class="flex items-center space-x-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.timeSlots.includes(slot)}
                      on:change={() => toggleTimeSlot(slot)}
                      class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span class="text-sm capitalize">{slot.replace('_', ' ')}</span>
                  </label>
                {/each}
              </div>
            </div>

            <FormField
              id="advanceBooking"
              label="Minimum Advance Booking (days)"
              type="number"
              bind:value={formData.advanceBooking}
              placeholder="1"
            />
          </div>
        </div>

        <!-- Languages -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-white">Languages</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            {#each languageOptions as language}
              <label class="flex items-center space-x-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.languages.includes(language)}
                  on:change={() => toggleLanguage(language)}
                  class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <span class="text-sm">{language}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Certifications -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-white">Certifications</h3>
          <div class="flex gap-2">
            <input
              id="new-certification"
              type="text"
              placeholder="Add certification..."
              class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              on:click={addCertification}
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>
          {#if formData.certifications.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each formData.certifications as cert, index}
                <span class="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  {cert}
                  <button
                    type="button"
                    on:click={() => removeCertification(index)}
                    class="text-blue-300 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Equipment -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-white">Equipment Provided</h3>
          <p class="text-white/70 text-sm">List equipment you provide to clients</p>
          <div class="flex gap-2">
            <input
              id="new-equipment"
              type="text"
              placeholder="Add equipment..."
              class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              on:click={addEquipment}
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>
          {#if formData.equipment.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each formData.equipment as item, index}
                <span class="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm flex items-center gap-2">
                  {item}
                  <button
                    type="button"
                    on:click={() => removeEquipment(index)}
                    class="text-green-300 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Response Time -->
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-white">Response Time</h3>
          <FormField
            id="responseTime"
            label="Typical Response Time"
            type="select"
            bind:value={formData.responseTime}
          >
            <option value="within 1 hour">Within 1 hour</option>
            <option value="within 2 hours">Within 2 hours</option>
            <option value="within 4 hours">Within 4 hours</option>
            <option value="within 24 hours">Within 24 hours</option>
            <option value="within 48 hours">Within 48 hours</option>
          </FormField>
        </div>

        <!-- Submit Button -->
        <FormButton
          type="submit"
          {loading}
          disabled={loading}
          fullWidth={true}
        >
          {loading ? 'Creating Profile...' : 'Create Guide Profile'}
        </FormButton>
      </form>
    </FormContainer>
  </div>
</section>
