<script lang="ts">
	import { onMount } from 'svelte';
	import { GearItem, User } from '$lib/api/entities.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Plus, Upload, DollarSign, MapPin, FileText } from 'lucide-svelte';
	import { createPageUrl } from '$lib/utils';

	let user: any = null;
	let loading = false;
	let formData = {
		name: '',
		description: '',
		category: '',
		pricePerDay: '',
		location: '',
		photos: [] as string[]
	};

	const categories = ['Camping', 'Hiking', 'Photography', 'Climbing', 'Water Sports', 'Winter Sports'];

	onMount(async () => {
		try {
			user = await User.me();
		} catch (error) {
			console.error('Error loading user:', error);
		}
	});

	async function handleSubmit() {
		if (!user) return;
		
		loading = true;
		try {
			const gearItem = await GearItem.create({
				...formData,
				pricePerDay: parseFloat(formData.pricePerDay),
				ownerId: user.id
			});
			
			// Reset form
			formData = {
				name: '',
				description: '',
				category: '',
				pricePerDay: '',
				location: '',
				photos: []
			};
			
			// You could add a success toast here
			console.log('Gear item created:', gearItem);
		} catch (error) {
			console.error('Error creating gear item:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-4xl mx-auto">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">List Your Gear</h1>
			<p class="text-gray-600">Share your outdoor equipment and earn money from rentals</p>
		</div>

		{#if !user}
			<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
				<CardContent class="p-8 text-center">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Sign In Required</h2>
					<p class="text-gray-600 mb-6">You need to be signed in to list your gear</p>
					<Button class="bg-emerald-600 hover:bg-emerald-700">
						Sign In
					</Button>
				</CardContent>
			</Card>
		{:else}
			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<!-- Basic Information -->
				<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<FileText class="w-5 h-5" />
							Basic Information
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
								Gear Name *
							</label>
							<Input
								id="name"
								bind:value={formData.name}
								placeholder="e.g., REI Co-op Dome 2 Tent"
								required
								class="bg-white border-gray-200"
							/>
						</div>

						<div>
							<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
								Description *
							</label>
							<textarea
								id="description"
								bind:value={formData.description}
								placeholder="Describe your gear, its condition, and any special features..."
								required
								rows="4"
								class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
							></textarea>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="category" class="block text-sm font-medium text-gray-700 mb-2">
									Category *
								</label>
								<Select bind:value={formData.category}>
									<SelectTrigger class="bg-white border-gray-200">
										<span>{formData.category || "Select a category"}</span>
									</SelectTrigger>
									<SelectContent>
										{#each categories as category}
											<SelectItem value={category}>{category}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</div>

							<div>
								<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
									Location *
								</label>
								<div class="relative">
									<MapPin class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
									<Input
										id="location"
										bind:value={formData.location}
										placeholder="City, State"
										required
										class="pl-10 bg-white border-gray-200"
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Pricing -->
				<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<DollarSign class="w-5 h-5" />
							Pricing
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div>
							<label for="price" class="block text-sm font-medium text-gray-700 mb-2">
								Price per Day *
							</label>
							<div class="relative">
								<DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
								<Input
									id="price"
									type="number"
									step="0.01"
									min="0"
									bind:value={formData.pricePerDay}
									placeholder="0.00"
									required
									class="pl-10 bg-white border-gray-200"
								/>
							</div>
							<p class="text-sm text-gray-500 mt-1">
								Set a competitive daily rental rate for your gear
							</p>
						</div>
					</CardContent>
				</Card>

				<!-- Photos -->
				<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Upload class="w-5 h-5" />
							Photos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
							<Upload class="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<h3 class="text-lg font-medium text-gray-900 mb-2">Upload Photos</h3>
							<p class="text-gray-600 mb-4">
								Add photos to showcase your gear (coming soon)
							</p>
							<Button type="button" variant="outline" disabled>
								Choose Files
							</Button>
						</div>
					</CardContent>
				</Card>

				<!-- Submit -->
				<div class="flex flex-col sm:flex-row gap-4 justify-end">
					<Button type="button" variant="outline" class="sm:w-auto">
						Save as Draft
					</Button>
					<Button 
						type="submit" 
						disabled={loading}
						class="bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
					>
						{#if loading}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
						{:else}
							<Plus class="w-4 h-4 mr-2" />
						{/if}
						List Gear
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>
