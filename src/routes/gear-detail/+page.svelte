<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { GearItem, User } from '$lib/api/entities.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { ArrowLeft, MapPin, Star, Calendar, Shield, MessageSquare } from 'lucide-svelte';
	import { cartStore } from '$lib/stores/cart';
	import { createPageUrl } from '$lib/utils';

	let gearItem: any = null;
	let owner: any = null;
	let loading = true;
	let user: any = null;

	onMount(async () => {
		try {
			const itemId = $page.url.searchParams.get('id');
			if (itemId) {
				gearItem = await GearItem.get(itemId);
				// Note: We can't get owner details with the current auth module
				// owner = await User.get(gearItem.ownerId);
			}
			user = await User.me();
		} catch (error) {
			console.error('Error loading gear item:', error);
		} finally {
			loading = false;
		}
	});

	function addToCart() {
		if (gearItem) {
			cartStore.addItem(gearItem);
			// You could add a toast notification here
		}
	}
</script>

{#if loading}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
		<div class="max-w-6xl mx-auto">
			<div class="animate-pulse">
				<div class="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div class="aspect-square bg-gray-200 rounded-xl"></div>
					<div class="space-y-4">
						<div class="h-8 bg-gray-200 rounded w-3/4"></div>
						<div class="h-4 bg-gray-200 rounded w-1/2"></div>
						<div class="h-20 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if gearItem}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
		<div class="max-w-6xl mx-auto">
			<!-- Back Button -->
			<div class="mb-8">
				<a href={createPageUrl("browse")}>
					<Button variant="outline" size="sm" class="gap-2">
						<ArrowLeft class="w-4 h-4" />
						Back to Browse
					</Button>
				</a>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Image Gallery -->
				<div class="space-y-4">
					<div class="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
						{#if gearItem.photos && gearItem.photos.length > 0}
							<img 
								src={gearItem.photos[0]} 
								alt={gearItem.name}
								class="w-full h-full object-cover"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center">
								<div class="text-gray-400 text-center">
									<div class="w-24 h-24 mx-auto mb-4 bg-gray-300 rounded-full"></div>
									<p>No image available</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Item Details -->
				<div class="space-y-6">
					<div>
						<div class="flex items-start justify-between mb-4">
							<div>
								<h1 class="text-3xl font-bold text-gray-900 mb-2">{gearItem.name}</h1>
								{#if gearItem.category}
									<Badge variant="secondary" class="mb-4">{gearItem.category}</Badge>
								{/if}
							</div>
							{#if gearItem.rating}
								<div class="flex items-center gap-1 bg-white rounded-full px-3 py-1 shadow-sm">
									<Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
									<span class="font-medium">{gearItem.rating}</span>
								</div>
							{/if}
						</div>

						<div class="text-3xl font-bold text-emerald-600 mb-4">
							${gearItem.pricePerDay || '0'}/day
						</div>

						<p class="text-gray-600 leading-relaxed mb-6">
							{gearItem.description}
						</p>

						{#if gearItem.location}
							<div class="flex items-center gap-2 text-gray-600 mb-6">
								<MapPin class="w-5 h-5" />
								<span>{gearItem.location}</span>
							</div>
						{/if}
					</div>

					<!-- Owner Info -->
					{#if owner}
						<Card class="bg-white/80 backdrop-blur-sm">
							<CardHeader>
								<div class="flex items-center gap-4">
									<div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
										<span class="font-semibold text-emerald-700">
											{owner.name?.charAt(0) || 'U'}
										</span>
									</div>
									<div>
										<h3 class="font-semibold text-gray-900">Owned by {owner.name || 'User'}</h3>
										<p class="text-sm text-gray-600">Gear owner</p>
									</div>
								</div>
							</CardHeader>
						</Card>
					{/if}

					<!-- Action Buttons -->
					<div class="space-y-3">
						{#if user}
							<Button 
								on:click={addToCart}
								class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold shadow-lg"
							>
								<Calendar class="w-5 h-5 mr-2" />
								Add to Cart
							</Button>
							
							<Button variant="outline" class="w-full py-3">
								<MessageSquare class="w-5 h-5 mr-2" />
								Message Owner
							</Button>
						{:else}
							<Button class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold">
								Sign In to Rent
							</Button>
						{/if}
					</div>

					<!-- GearGrab Guarantee -->
					<Card class="bg-emerald-50 border-emerald-200">
						<CardContent class="p-4">
							<div class="flex items-start gap-3">
								<Shield class="w-6 h-6 text-emerald-600 mt-1" />
								<div>
									<h4 class="font-semibold text-emerald-900 mb-1">GearGrab Guarantee</h4>
									<p class="text-sm text-emerald-700">
										Protected rentals with damage coverage and dispute resolution.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
		<div class="max-w-6xl mx-auto">
			<div class="text-center py-16">
				<h1 class="text-2xl font-bold text-gray-900 mb-4">Gear Item Not Found</h1>
				<p class="text-gray-600 mb-8">The gear item you're looking for doesn't exist or has been removed.</p>
				<a href={createPageUrl("browse")}>
					<Button>Back to Browse</Button>
				</a>
			</div>
		</div>
	</div>
{/if}
