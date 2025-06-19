<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BookingWizard from './booking-wizard.svelte';
  import type { Listing } from '$lib/types/firestore';

  export let listing: Listing;
  export let startDate: Date | string;
  export let endDate: Date | string;
  export let deliveryMethod: 'pickup' | 'delivery' = 'pickup';
  export let deliveryFee: number = 0;

  const dispatch = createEventDispatcher();

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<!-- Booking Flow using BookingWizard -->
<BookingWizard
  {listing}
  {startDate}
  {endDate}
  {deliveryMethod}
  {deliveryFee}
  on:cancel="{handleCancel}"
/>


