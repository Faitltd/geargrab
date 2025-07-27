<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { GearItem, Rental, User } from '$lib/api/entities.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import DialogHeader from '$lib/components/ui/DialogHeader.svelte';
  import DialogTitle from '$lib/components/ui/DialogTitle.svelte';
  import PhotoDocumentation from '$lib/components/PhotoDocumentation.svelte';
  import { ArrowLeft, CreditCard, Calendar, ShieldCheck, Camera } from 'lucide-svelte';
  import { format, differenceInDays } from 'date-fns';

  let gearItem: any = null;
  let user: any = null;
  let dates = { from: null, to: null };
  let isLoading = true;
  let isProcessing = false;
  let showPhotoDialog = false;
  let checkoutPhotos: string[] = [];
  let checkoutNotes = "";
  let isUploadingPhotos = false;

  $: gearId = $page.url.searchParams.get('id');
  $: fromDate = $page.url.searchParams.get('from');
  $: toDate = $page.url.searchParams.get('to');

  onMount(() => {
    if (gearId && fromDate && toDate) {
      loadCheckoutData();
    } else {
      goto('/browse');
    }
  });

  async function loadCheckoutData() {
    try {
      isLoading = true;
      const [items, currentUser] = await Promise.all([
        GearItem.list(),
        User.me().catch(() => null)
      ]);

      const item = items.data?.find(g => g.id === gearId);

      if (!item || !currentUser) {
        goto('/browse');
        return;
      }
      
      gearItem = item;
      user = currentUser;
      dates = { from: new Date(fromDate), to: new Date(toDate) };
    } catch (error) {
      console.error("Error loading checkout data:", error);
    } finally {
      isLoading = false;
    }
  }

  function calculateTotal() {
    if (!dates.from || !dates.to) return { days: 0, subtotal: 0, serviceFee: 0, total: 0 };
    const days = differenceInDays(dates.to, dates.from) + 1;
    const subtotal = days * gearItem.daily_rate;
    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;
    return { days, subtotal, serviceFee, total };
  }

  function handleInitiateCheckout() {
    // Show photo documentation dialog before payment
    showPhotoDialog = true;
  }

  async function handlePhotoSubmit() {
    isProcessing = true;
    try {
      const { subtotal, serviceFee, total } = calculateTotal();

      // Create rental record with checkout photos
      const rental = await Rental.create({
        gear_item_id: gearItem.id,
        renter_email: user.email,
        owner_email: gearItem.created_by,
        start_date: format(dates.from, "yyyy-MM-dd"),
        end_date: format(dates.to, "yyyy-MM-dd"),
        total_amount: total,
        status: "confirmed",
        checkout_photos: checkoutPhotos,
        checkout_notes: checkoutNotes
      });

      // Close photo dialog and redirect
      showPhotoDialog = false;
      goto('/my-rentals');
    } catch (error) {
      console.error("Error confirming rental:", error);
    } finally {
      isProcessing = false;
    }
  }

  function handleCancelPhotoDialog() {
    showPhotoDialog = false;
    checkoutPhotos = [];
    checkoutNotes = "";
  }

  function handlePhotosChange(event) {
    checkoutPhotos = event.detail;
  }

  function handleNotesChange(event) {
    checkoutNotes = event.detail;
  }

  $: ({ days, subtotal, serviceFee, total } = calculateTotal());
</script>

<svelte:head>
  <title>Checkout - GearGrab</title>
</svelte:head>

{#if isLoading || !gearItem}
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8 animate-pulse">
    <div class="max-w-4xl mx-auto">
      <div class="h-8 w-32 bg-gray-200 rounded mb-8"></div>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="h-96 bg-gray-200 rounded-xl"></div>
        <div class="h-96 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <Button variant="outline" href="/gear-detail?id={gearId}" className="flex items-center gap-2">
          <ArrowLeft class="w-4 h-4" />
          Back to Gear
        </Button>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Left Column: Payment Form -->
        <div class="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard class="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 class="font-semibold mb-4">Price Breakdown</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">${gearItem.daily_rate}/day × {days} days</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Service fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between font-bold text-base pt-2 border-t mt-2">
                    <span>Total (USD)</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="font-semibold mb-2">Pay with (Simulated)</h3>
                <div class="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">
                  Payment Gateway Placeholder
                </div>
              </div>

              <Button
                className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                disabled={isProcessing}
                on:click={handleInitiateCheckout}
              >
                <Camera class="w-5 h-5" />
                {isProcessing ? "Processing..." : "Document & Pay"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Order Details -->
        <div class="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
            <CardContent className="p-6">
              <div class="flex items-start gap-4">
                <div class="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {#if gearItem.photos && gearItem.photos[0]}
                    <img src={gearItem.photos[0]} alt={gearItem.title} class="w-full h-full object-cover" />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center">
                      <CreditCard class="w-8 h-8 text-gray-400" />
                    </div>
                  {/if}
                </div>
                <div>
                  <h3 class="font-bold text-lg text-gray-900">{gearItem.title}</h3>
                  <p class="text-sm text-gray-600">{gearItem.brand}</p>
                </div>
              </div>
              <div class="mt-4 pt-4 border-t space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold">Your trip</span>
                  <Button variant="link" size="sm" href="/gear-detail?id={gearId}" className="p-0 h-auto">Edit</Button>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Dates</span>
                  <span>{format(dates.from, "MMM d, yyyy")} - {format(dates.to, "MMM d, yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Photo Documentation Dialog -->
    <Dialog bind:open={showPhotoDialog} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Document Gear Condition</DialogTitle>
      </DialogHeader>
      <div class="mt-4">
        <PhotoDocumentation
          title="Initial Condition Documentation"
          description="Please take photos of the gear's current condition before checkout. This helps protect both you and the owner."
          bind:photos={checkoutPhotos}
          bind:notes={checkoutNotes}
          on:photosChange={handlePhotosChange}
          on:notesChange={handleNotesChange}
          on:submit={handlePhotoSubmit}
          on:cancel={handleCancelPhotoDialog}
          {isUploadingPhotos}
          {isProcessing}
          minPhotos={2}
          maxPhotos={8}
          required={true}
          showNotes={true}
          submitButtonText="Complete Checkout"
          cancelButtonText="Cancel"
          documentationType="checkout"
        />
      </div>
    </Dialog>
  </div>
{/if}
