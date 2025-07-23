<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { GearItem, User } from '$lib/api/entities.js';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardFooter, CardHeader } from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Search, MapPin, Star, SlidersHorizontal, Mountain, Camera, Tent } from 'lucide-svelte';
	import { createPageUrl } from '$lib/utils';

	let gearItems: any[] = [];
	let filteredItems: any[] = [];
	let searchTerm = '';
	let selectedCategory = '';
	let user: any = null;
	let loading = true;

	const categoryIcons: Record<string, any> = {
		'Camping': Tent,
		'Hiking': Mountain,
		'Photography': Camera,
	};

	onMount(async () => {
		try {
			// Load user
			user = await User.me();

			// Load gear items
			const items = await GearItem.list();
			gearItems = items || [];
			filteredItems = gearItems;
		} catch (error) {
			console.error('Error loading data:', error);
			gearItems = [];
			filteredItems = [];
		} finally {
			loading = false;
		}
	});

	$: {
		filteredItems = gearItems.filter(item => {
			const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
								item.description?.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = !selectedCategory || item.category === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	}

	const categories = ['Camping', 'Hiking', 'Photography', 'Climbing', 'Water Sports'];
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-7xl mx-auto">
		<div class="mb-8">
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
				<div>
					<h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
						Discover Outdoor Gear
					</h1>
					<p class="text-gray-600">Rent premium outdoor equipment from fellow adventurers</p>
				</div>
				{#if user}
					<a href={createPageUrl("list-gear")}>
						<Button class="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
							List Your Gear
						</Button>
					</a>
				{/if}
			</div>

			<!-- Search and Filter Section -->
			<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
				<div class="flex flex-col md:flex-row gap-4">
					<div class="flex-1 relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<Input
							bind:value={searchTerm}
							placeholder="Search for outdoor gear..."
							class="pl-10 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
						/>
					</div>
					<div class="flex gap-3">
						<Select bind:value={selectedCategory}>
							<SelectTrigger class="w-48 bg-white border-gray-200">
								<span>{selectedCategory || "All Categories"}</span>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">All Categories</SelectItem>
								{#each categories as category}
									<SelectItem value={category}>{category}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
						<Button variant="outline" size="icon" class="border-gray-200 hover:bg-emerald-50 hover:border-emerald-300">
							<SlidersHorizontal class="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>

		<!-- Loading State -->
		{#if loading}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each Array(8) as _}
					<div class="bg-white/80 rounded-xl p-4 animate-pulse">
						<div class="aspect-[4/3] bg-gray-200 rounded-lg mb-4"></div>
						<div class="h-4 bg-gray-200 rounded mb-2"></div>
						<div class="h-3 bg-gray-200 rounded w-2/3"></div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Gear Items Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" in:fade={{ duration: 300 }}>
				{#each filteredItems as item, i}
					{@const IconComponent = categoryIcons[item.category] || Mountain}
					<div class="group" in:fly={{ y: 20, delay: i * 50, duration: 300 }}>
						<a href={createPageUrl(`gear-detail?id=${item.id}`)}>
							<Card class="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
								<CardHeader class="p-0">
									<div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
										{#if item.photos && item.photos.length > 0}
											<img
												src={item.photos[0]}
												alt={item.name}
												class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<svelte:component this={IconComponent} class="w-16 h-16 text-gray-400" />
											</div>
										{/if}
										<div class="absolute top-3 left-3">
											<Badge variant="secondary" class="bg-white/90 text-gray-700 shadow-sm">
												{item.category || 'Outdoor Gear'}
											</Badge>
										</div>
										{#if item.rating}
											<div class="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
												<Star class="w-3 h-3 fill-yellow-400 text-yellow-400" />
												<span class="text-xs font-medium text-gray-700">{item.rating}</span>
											</div>
										{/if}
									</div>
								</CardHeader>
								<CardContent class="p-4">
									<h3 class="font-semibold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors duration-200">
										{item.name}
									</h3>
									<p class="text-sm text-gray-600 mb-3 line-clamp-2">
										{item.description}
									</p>
									{#if item.location}
										<div class="flex items-center gap-1 text-xs text-gray-500 mb-2">
											<MapPin class="w-3 h-3" />
											<span>{item.location}</span>
										</div>
									{/if}
								</CardContent>
								<CardFooter class="p-4 pt-0 flex justify-between items-center">
									<div class="text-lg font-bold text-emerald-600">
										${item.pricePerDay || '0'}/day
									</div>
									<Button size="sm" class="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
										View Details
									</Button>
								</CardFooter>
							</Card>
						</a>
					</div>
				{/each}
			</div>

			<!-- Empty State -->
			{#if filteredItems.length === 0 && !loading}
				<div class="text-center py-16">
					<Mountain class="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h3 class="text-xl font-semibold text-gray-600 mb-2">No gear found</h3>
					<p class="text-gray-500 mb-6">Try adjusting your search or browse all categories</p>
					<Button on:click={() => { searchTerm = ''; selectedCategory = ''; }} variant="outline">
						Clear Filters
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
