<script lang="ts">
	import { onMount } from 'svelte';
	import { User, GearItem } from '$lib/api/entities.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { User as UserIcon, Mail, MapPin, Calendar, Settings, Star, Package } from 'lucide-svelte';

	let user: any = null;
	let userGear: any[] = [];
	let loading = true;
	let editMode = false;
	let editData = {
		name: '',
		email: '',
		location: ''
	};

	onMount(async () => {
		try {
			user = await User.me();
			if (user) {
				editData = {
					name: user.name || '',
					email: user.email || '',
					location: user.location || ''
				};

				// Load user's gear
				const allGear = await GearItem.list();
				userGear = allGear.filter((item: any) => item.ownerId === user.id);
			}
		} catch (error) {
			console.error('Error loading profile:', error);
		} finally {
			loading = false;
		}
	});

	async function saveProfile() {
		if (!user) return;

		try {
			await User.updateMe(editData);
			user = { ...user, ...editData };
			editMode = false;
		} catch (error) {
			console.error('Error updating profile:', error);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-6xl mx-auto">
		{#if loading}
			<div class="animate-pulse">
				<div class="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div class="lg:col-span-1">
						<div class="bg-gray-200 rounded-xl h-64"></div>
					</div>
					<div class="lg:col-span-2">
						<div class="bg-gray-200 rounded-xl h-64"></div>
					</div>
				</div>
			</div>
		{:else if !user}
			<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
				<CardContent class="p-8 text-center">
					<UserIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h2 class="text-xl font-semibold text-gray-600 mb-4">Sign In Required</h2>
					<p class="text-gray-500 mb-6">You need to be signed in to view your profile</p>
					<Button class="bg-emerald-600 hover:bg-emerald-700">
						Sign In
					</Button>
				</CardContent>
			</Card>
		{:else}
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
				<p class="text-gray-600">Manage your account and gear listings</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Profile Info -->
				<div class="lg:col-span-1">
					<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
						<CardHeader class="text-center">
							<div class="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<span class="text-3xl font-bold text-emerald-700">
									{user.name?.charAt(0) || 'U'}
								</span>
							</div>
							<CardTitle class="text-xl">{user.name || 'User'}</CardTitle>
							<div class="flex items-center justify-center gap-1 text-yellow-500">
								<Star class="w-4 h-4 fill-current" />
								<span class="text-sm font-medium text-gray-700">
									{user.rating || '5.0'} ({user.reviewCount || '0'} reviews)
								</span>
							</div>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if editMode}
								<div class="space-y-3">
									<div>
										<label for="edit-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
										<Input id="edit-name" bind:value={editData.name} class="bg-white border-gray-200" />
									</div>
									<div>
										<label for="edit-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
										<Input id="edit-email" bind:value={editData.email} type="email" class="bg-white border-gray-200" />
									</div>
									<div>
										<label for="edit-location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
										<Input id="edit-location" bind:value={editData.location} class="bg-white border-gray-200" />
									</div>
									<div class="flex gap-2">
										<Button on:click={saveProfile} size="sm" class="bg-emerald-600 hover:bg-emerald-700">
											Save
										</Button>
										<Button on:click={() => editMode = false} size="sm" variant="outline">
											Cancel
										</Button>
									</div>
								</div>
							{:else}
								<div class="space-y-3">
									<div class="flex items-center gap-2 text-gray-600">
										<Mail class="w-4 h-4" />
										<span class="text-sm">{user.email || 'No email'}</span>
									</div>
									{#if user.location}
										<div class="flex items-center gap-2 text-gray-600">
											<MapPin class="w-4 h-4" />
											<span class="text-sm">{user.location}</span>
										</div>
									{/if}
									{#if user.createdAt}
										<div class="flex items-center gap-2 text-gray-600">
											<Calendar class="w-4 h-4" />
											<span class="text-sm">Joined {formatDate(user.createdAt)}</span>
										</div>
									{/if}
								</div>
								<Button on:click={() => editMode = true} variant="outline" class="w-full">
									<Settings class="w-4 h-4 mr-2" />
									Edit Profile
								</Button>
							{/if}
						</CardContent>
					</Card>
				</div>

				<!-- Profile Content -->
				<div class="lg:col-span-2">
					<Tabs value="gear" class="space-y-6">
						<TabsList class="bg-white shadow-sm border border-gray-100">
							<TabsTrigger value="gear" class="px-6">My Gear ({userGear.length})</TabsTrigger>
							<TabsTrigger value="reviews" class="px-6">Reviews</TabsTrigger>
							<TabsTrigger value="settings" class="px-6">Settings</TabsTrigger>
						</TabsList>

						<TabsContent value="gear" class="space-y-4">
							{#if userGear.length === 0}
								<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
									<CardContent class="p-8 text-center">
										<Package class="w-16 h-16 text-gray-300 mx-auto mb-4" />
										<h3 class="text-xl font-semibold text-gray-600 mb-2">No gear listed yet</h3>
										<p class="text-gray-500 mb-6">Start earning by listing your outdoor equipment</p>
										<Button class="bg-emerald-600 hover:bg-emerald-700">
											List Your First Item
										</Button>
									</CardContent>
								</Card>
							{:else}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									{#each userGear as item}
										<Card class="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
											<CardContent class="p-4">
												<div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 overflow-hidden">
													{#if item.photos && item.photos.length > 0}
														<img 
															src={item.photos[0]} 
															alt={item.name}
															class="w-full h-full object-cover"
														/>
													{:else}
														<div class="w-full h-full flex items-center justify-center">
															<Package class="w-12 h-12 text-gray-400" />
														</div>
													{/if}
												</div>
												<h3 class="font-semibold text-gray-900 mb-2">{item.name}</h3>
												<div class="flex items-center justify-between">
													<Badge variant="secondary">{item.category}</Badge>
													<span class="font-bold text-emerald-600">
														${item.pricePerDay}/day
													</span>
												</div>
											</CardContent>
										</Card>
									{/each}
								</div>
							{/if}
						</TabsContent>

						<TabsContent value="reviews">
							<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
								<CardContent class="p-8 text-center">
									<Star class="w-16 h-16 text-gray-300 mx-auto mb-4" />
									<h3 class="text-xl font-semibold text-gray-600 mb-2">No reviews yet</h3>
									<p class="text-gray-500">Reviews from renters will appear here</p>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="settings">
							<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
								<CardHeader>
									<CardTitle>Account Settings</CardTitle>
								</CardHeader>
								<CardContent class="space-y-4">
									<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div>
											<h4 class="font-medium text-gray-900">Email Notifications</h4>
											<p class="text-sm text-gray-600">Receive updates about your rentals</p>
										</div>
										<Button variant="outline" size="sm">
											Configure
										</Button>
									</div>
									<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div>
											<h4 class="font-medium text-gray-900">Privacy Settings</h4>
											<p class="text-sm text-gray-600">Control who can see your profile</p>
										</div>
										<Button variant="outline" size="sm">
											Manage
										</Button>
									</div>
									<div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
										<div>
											<h4 class="font-medium text-red-900">Delete Account</h4>
											<p class="text-sm text-red-600">Permanently delete your account and data</p>
										</div>
										<Button variant="destructive" size="sm">
											Delete
										</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		{/if}
	</div>
</div>
