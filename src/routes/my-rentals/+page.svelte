<script lang="ts">
	import { onMount } from 'svelte';
	import { Rental, User } from '$lib/api/entities.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Calendar, MapPin, MessageSquare, Camera, FileText } from 'lucide-svelte';

	let borrowingRentals: any[] = [];
	let lendingRentals: any[] = [];
	let loading = true;
	let user: any = null;

	onMount(async () => {
		try {
			user = await User.me();
			if (user) {
				const allRentals = await Rental.list();
				borrowingRentals = allRentals.filter((rental: any) => rental.renterId === user.id);
				lendingRentals = allRentals.filter((rental: any) => rental.ownerId === user.id);
			}
		} catch (error) {
			console.error('Error loading rentals:', error);
		} finally {
			loading = false;
		}
	});

	function getStatusColor(status: string) {
		switch (status?.toLowerCase()) {
			case 'active': return 'bg-green-100 text-green-800';
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'completed': return 'bg-blue-100 text-blue-800';
			case 'cancelled': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-6xl mx-auto">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">My Rentals</h1>
			<p class="text-gray-600">Manage your gear rentals and exchanges</p>
		</div>

		<Tabs value="borrowing" class="space-y-6">
			<TabsList class="bg-white shadow-sm border border-gray-100">
				<TabsTrigger value="borrowing" class="px-6">Borrowing</TabsTrigger>
				<TabsTrigger value="lending" class="px-6">Lending</TabsTrigger>
			</TabsList>

			<TabsContent value="borrowing" class="space-y-4">
				{#if loading}
					<div class="space-y-4">
						{#each Array(3) as _}
							<div class="bg-white/80 rounded-xl p-6 animate-pulse">
								<div class="flex gap-4">
									<div class="w-24 h-24 bg-gray-200 rounded-lg"></div>
									<div class="flex-1 space-y-2">
										<div class="h-4 bg-gray-200 rounded w-1/3"></div>
										<div class="h-3 bg-gray-200 rounded w-1/2"></div>
										<div class="h-3 bg-gray-200 rounded w-1/4"></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else if borrowingRentals.length === 0}
					<div class="text-center py-16">
						<Calendar class="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h3 class="text-xl font-semibold text-gray-600 mb-2">No rentals yet</h3>
						<p class="text-gray-500 mb-6">Start browsing gear to make your first rental</p>
						<Button class="bg-emerald-600 hover:bg-emerald-700">
							Browse Gear
						</Button>
					</div>
				{:else}
					<div class="space-y-4">
						{#each borrowingRentals as rental}
							<Card class="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
								<CardContent class="p-6">
									<div class="flex flex-col md:flex-row gap-6">
										<div class="w-full md:w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
											{#if rental.gearItem?.photos?.[0]}
												<img 
													src={rental.gearItem.photos[0]} 
													alt={rental.gearItem.name}
													class="w-full h-full object-cover"
												/>
											{:else}
												<div class="w-full h-full flex items-center justify-center">
													<Camera class="w-8 h-8 text-gray-400" />
												</div>
											{/if}
										</div>
										
										<div class="flex-1">
											<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
												<div>
													<h3 class="text-xl font-semibold text-gray-900 mb-2">
														{rental.gearItem?.name || 'Gear Item'}
													</h3>
													<div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
														{#if rental.startDate && rental.endDate}
															<div class="flex items-center gap-1">
																<Calendar class="w-4 h-4" />
																<span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
															</div>
														{/if}
														{#if rental.gearItem?.location}
															<div class="flex items-center gap-1">
																<MapPin class="w-4 h-4" />
																<span>{rental.gearItem.location}</span>
															</div>
														{/if}
													</div>
													<Badge class={getStatusColor(rental.status)}>
														{rental.status || 'Pending'}
													</Badge>
												</div>
												
												<div class="text-right">
													<div class="text-2xl font-bold text-emerald-600 mb-2">
														${rental.totalPrice || '0'}
													</div>
													<div class="flex flex-col sm:flex-row gap-2">
														<Button size="sm" variant="outline" class="gap-2">
															<MessageSquare class="w-4 h-4" />
															Message
														</Button>
														<Button size="sm" variant="outline" class="gap-2">
															<FileText class="w-4 h-4" />
															Details
														</Button>
													</div>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{/if}
			</TabsContent>

			<TabsContent value="lending" class="space-y-4">
				{#if loading}
					<div class="space-y-4">
						{#each Array(3) as _}
							<div class="bg-white/80 rounded-xl p-6 animate-pulse">
								<div class="flex gap-4">
									<div class="w-24 h-24 bg-gray-200 rounded-lg"></div>
									<div class="flex-1 space-y-2">
										<div class="h-4 bg-gray-200 rounded w-1/3"></div>
										<div class="h-3 bg-gray-200 rounded w-1/2"></div>
										<div class="h-3 bg-gray-200 rounded w-1/4"></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else if lendingRentals.length === 0}
					<div class="text-center py-16">
						<Calendar class="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h3 class="text-xl font-semibold text-gray-600 mb-2">No lending activity</h3>
						<p class="text-gray-500 mb-6">List your gear to start earning from rentals</p>
						<Button class="bg-emerald-600 hover:bg-emerald-700">
							List Your Gear
						</Button>
					</div>
				{:else}
					<div class="space-y-4">
						{#each lendingRentals as rental}
							<Card class="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
								<CardContent class="p-6">
									<div class="flex flex-col md:flex-row gap-6">
										<div class="w-full md:w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
											{#if rental.gearItem?.photos?.[0]}
												<img 
													src={rental.gearItem.photos[0]} 
													alt={rental.gearItem.name}
													class="w-full h-full object-cover"
												/>
											{:else}
												<div class="w-full h-full flex items-center justify-center">
													<Camera class="w-8 h-8 text-gray-400" />
												</div>
											{/if}
										</div>
										
										<div class="flex-1">
											<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
												<div>
													<h3 class="text-xl font-semibold text-gray-900 mb-2">
														{rental.gearItem?.name || 'Gear Item'}
													</h3>
													<div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
														{#if rental.startDate && rental.endDate}
															<div class="flex items-center gap-1">
																<Calendar class="w-4 h-4" />
																<span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
															</div>
														{/if}
														<div class="text-gray-600">
															Rented by: {rental.renter?.name || 'User'}
														</div>
													</div>
													<Badge class={getStatusColor(rental.status)}>
														{rental.status || 'Pending'}
													</Badge>
												</div>
												
												<div class="text-right">
													<div class="text-2xl font-bold text-emerald-600 mb-2">
														${rental.totalPrice || '0'}
													</div>
													<div class="flex flex-col sm:flex-row gap-2">
														<Button size="sm" variant="outline" class="gap-2">
															<MessageSquare class="w-4 h-4" />
															Message
														</Button>
														<Button size="sm" variant="outline" class="gap-2">
															<FileText class="w-4 h-4" />
															Details
														</Button>
													</div>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{/if}
			</TabsContent>
		</Tabs>
	</div>
</div>
