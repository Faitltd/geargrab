<script lang="ts">
  import { onMount } from 'svelte';
  import { Rental, GearItem, User } from '$lib/api/entities.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import DialogHeader from '$lib/components/ui/DialogHeader.svelte';
  import DialogTitle from '$lib/components/ui/DialogTitle.svelte';
  import PhotoDocumentation from '$lib/components/PhotoDocumentation.svelte';
  import { Camera, Calendar, MapPin, DollarSign, CheckCircle, AlertTriangle, Star } from 'lucide-svelte';
  import { format } from 'date-fns';

  let rentals: any[] = [];
  let gearItems: any[] = [];
  let users: any[] = [];
  let user: any = null;
  let isLoading = true;
  let photoDialog = { open: false, rental: null, type: null };
  let uploadingPhotos = false;
  let tempPhotos: string[] = [];
  let notes = "";
  let activeTab = 'borrowing';

  onMount(() => {
    loadData();
  });

  async function loadData() {
    try {
      isLoading = true;
      const [currentUser, rentalData, gearData, userData] = await Promise.all([
        User.me().catch(() => null),
        Rental.filter({}).catch(() => ({ data: [] })),
        GearItem.list().catch(() => ({ data: [] })),
        User.filter({}).catch(() => ({ data: [] }))
      ]);

      if (!currentUser) {
        // Redirect to login
        return;
      }

      user = currentUser;
      rentals = rentalData.data || [];
      gearItems = gearData.data || [];
      users = userData.data || [];
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      isLoading = false;
    }
  }

  async function submitPhotos() {
    if (!photoDialog.rental || tempPhotos.length === 0) return;

    try {
      const updates = {
        [photoDialog.type === 'pickup' ? 'pickup_photos' : 'return_photos']: tempPhotos,
        [photoDialog.type === 'pickup' ? 'pickup_notes' : 'return_notes']: notes
      };

      if (photoDialog.type === 'pickup') {
        updates.status = 'active';
      } else {
        updates.status = 'completed';
      }

      await Rental.update(photoDialog.rental.id, updates);
      
      photoDialog = { open: false, rental: null, type: null };
      tempPhotos = [];
      notes = "";
      loadData();
    } catch (error) {
      console.error("Error submitting photos:", error);
    }
  }

  function handleCancelPhotoDialog() {
    photoDialog = { open: false, rental: null, type: null };
    tempPhotos = [];
    notes = "";
  }

  function handlePhotosChange(event) {
    tempPhotos = event.detail;
  }

  function handleNotesChange(event) {
    notes = event.detail;
  }

  function getStatusColor(status: string) {
    const colors = {
      'confirmed': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'disputed': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  $: borrowingRentals = rentals.filter(r => r.renter_email === user?.email);
  $: lendingRentals = rentals.filter(r => r.owner_email === user?.email);
</script>

<svelte:head>
  <title>My Rentals - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
  <div class="max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">My Rentals</h1>
      <p class="text-gray-600">Manage your gear rentals and bookings</p>
    </div>

    <!-- Tabs -->
    <div class="mb-8">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'borrowing' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            on:click={() => activeTab = 'borrowing'}
          >
            Borrowing ({borrowingRentals.length})
          </button>
          <button
            class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'lending' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            on:click={() => activeTab = 'lending'}
          >
            Lending ({lendingRentals.length})
          </button>
        </nav>
      </div>
    </div>

    {#if isLoading}
      <div class="space-y-4">
        {#each Array(3) as _}
          <div class="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-6 animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- Borrowing Tab -->
      {#if activeTab === 'borrowing'}
        <div class="space-y-6">
          {#if borrowingRentals.length === 0}
            <div class="text-center py-12">
              <h3 class="text-lg font-semibold text-gray-700 mb-2">No rentals yet</h3>
              <p class="text-gray-500 mb-4">Start exploring gear to rent!</p>
              <Button href="/browse" className="bg-emerald-600 hover:bg-emerald-700">
                Browse Gear
              </Button>
            </div>
          {:else}
            <div class="space-y-4">
              {#each borrowingRentals as rental}
                {@const gear = gearItems.find(g => g.id === rental.gear_item_id)}
                {@const owner = users.find(u => u.email === rental.owner_email)}
                
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
                  <CardHeader>
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <CardTitle className="text-xl mb-2">{gear?.title || 'Unknown Gear'}</CardTitle>
                        <div class="flex items-center gap-4 text-sm text-gray-600">
                          <div class="flex items-center gap-1">
                            <Calendar class="w-4 h-4" />
                            {format(new Date(rental.start_date), "MMM d")} - {format(new Date(rental.end_date), "MMM d, yyyy")}
                          </div>
                          <div class="flex items-center gap-1">
                            <DollarSign class="w-4 h-4" />
                            ${rental.total_amount}
                          </div>
                          <div class="flex items-center gap-1">
                            <MapPin class="w-4 h-4" />
                            {gear?.location || 'Location TBD'}
                          </div>
                        </div>
                      </div>
                      <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(rental.status)}">
                        {rental.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div class="flex justify-between items-center">
                      <div class="text-sm">
                        <p class="text-gray-600">Owner: <span class="font-medium text-gray-900">{owner?.full_name || 'Unknown'}</span></p>
                      </div>
                      <div class="flex gap-2">
                        {#if rental.status === 'confirmed'}
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            on:click={() => photoDialog = { open: true, rental, type: 'pickup' }}
                          >
                            <Camera class="w-4 h-4 mr-1" />
                            Pickup Photos
                          </Button>
                        {/if}
                        
                        {#if rental.status === 'active'}
                          <Button
                            size="sm"
                            variant="outline"
                            on:click={() => photoDialog = { open: true, rental, type: 'return' }}
                          >
                            <Camera class="w-4 h-4 mr-1" />
                            Return Photos
                          </Button>
                        {/if}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Lending Tab -->
      {#if activeTab === 'lending'}
        <div class="space-y-6">
          {#if lendingRentals.length === 0}
            <div class="text-center py-12">
              <h3 class="text-lg font-semibold text-gray-700 mb-2">No gear lent out yet</h3>
              <p class="text-gray-500 mb-4">List your gear to start earning!</p>
              <Button href="/list-gear" className="bg-emerald-600 hover:bg-emerald-700">
                List Your Gear
              </Button>
            </div>
          {:else}
            <div class="space-y-4">
              {#each lendingRentals as rental}
                {@const gear = gearItems.find(g => g.id === rental.gear_item_id)}
                {@const renter = users.find(u => u.email === rental.renter_email)}
                
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
                  <CardHeader>
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <CardTitle className="text-xl mb-2">{gear?.title || 'Unknown Gear'}</CardTitle>
                        <div class="flex items-center gap-4 text-sm text-gray-600">
                          <div class="flex items-center gap-1">
                            <Calendar class="w-4 h-4" />
                            {format(new Date(rental.start_date), "MMM d")} - {format(new Date(rental.end_date), "MMM d, yyyy")}
                          </div>
                          <div class="flex items-center gap-1">
                            <DollarSign class="w-4 h-4" />
                            ${rental.total_amount}
                          </div>
                        </div>
                      </div>
                      <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(rental.status)}">
                        {rental.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div class="text-sm">
                      <p class="text-gray-600">Renter: <span class="font-medium text-gray-900">{renter?.full_name || 'Unknown'}</span></p>
                    </div>
                  </CardContent>
                </Card>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}

    <!-- Photo Upload Dialog -->
    <Dialog bind:open={photoDialog.open} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {photoDialog.type === 'pickup' ? 'Pickup' : 'Return'} Documentation
        </DialogTitle>
      </DialogHeader>
      <div class="mt-4">
        <PhotoDocumentation
          title="{photoDialog.type === 'pickup' ? 'Pickup' : 'Return'} Condition Documentation"
          description="Please take photos of the gear's condition {photoDialog.type === 'pickup' ? 'at pickup' : 'before return'}. This helps protect both parties and ensures proper documentation."
          bind:photos={tempPhotos}
          bind:notes
          on:photosChange={handlePhotosChange}
          on:notesChange={handleNotesChange}
          on:submit={submitPhotos}
          on:cancel={handleCancelPhotoDialog}
          {uploadingPhotos}
          isSubmitting={false}
          minPhotos={photoDialog.type === 'return' ? 3 : 2}
          maxPhotos={10}
          required={true}
          showNotes={true}
          submitButtonText="Complete {photoDialog.type === 'pickup' ? 'Pickup' : 'Return'}"
          cancelButtonText="Cancel"
          documentationType={photoDialog.type || 'pickup'}
        />
      </div>
    </Dialog>
  </div>
</div>
