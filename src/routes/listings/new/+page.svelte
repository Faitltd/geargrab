<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import ListingForm from '$lib/components/listings/ListingForm.svelte';
  import { goto } from '$app/navigation';

  const handleListingSuccess = (event: CustomEvent) => {
    const { listingId } = event.detail;

    // Redirect to the listing page or dashboard
    setTimeout(() => {
      goto(`/gear/${listingId}`);
    }, 2000);
  };

  const handleListingCancel = () => {
    goto('/dashboard');
  };
</script>

<Layout
  title="List New Gear - GearGrab"
  showHero={false}
>
  <ListingForm
    on:success={handleListingSuccess}
    on:cancel={handleListingCancel}
  />
</Layout>
