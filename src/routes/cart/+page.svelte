<script lang="ts">
	import { cartStore } from '$lib/stores/cart';
	import { User } from '$lib/api/entities.js';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { ShoppingBag, Trash2, Calendar, MapPin, Minus, Plus } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let cartItems: any[] = [];
	let user: any = null;
	let loading = true;

	onMount(async () => {
		try {
			user = await User.me();
			cartStore.subscribe(items => {
				cartItems = items;
			});
		} catch (error) {
			console.error('Error loading user:', error);
		} finally {
			loading = false;
		}
	});

	function removeFromCart(itemId: string) {
		cartStore.removeItem(itemId);
	}

	function clearCart() {
		cartStore.clear();
	}

	function calculateTotal() {
		return cartItems.reduce((total, item) => total + (item.pricePerDay || 0), 0);
	}

	function proceedToCheckout() {
		if (cartItems.length > 0) {
			goto('/checkout');
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-6xl mx-auto">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
			<p class="text-gray-600">Review your selected gear before checkout</p>
		</div>

		{#if loading}
			<div class="animate-pulse space-y-4">
				{#each Array(3) as _}
					<div class="bg-white/80 rounded-xl p-6">
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
		{:else if cartItems.length === 0}
			<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
				<CardContent class="p-12 text-center">
					<ShoppingBag class="w-20 h-20 text-gray-300 mx-auto mb-6" />
					<h2 class="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
					<p class="text-gray-500 mb-8">Browse our gear collection to find equipment for your next adventure</p>
					<Button on:click={() => goto('/')} class="bg-emerald-600 hover:bg-emerald-700">
						Browse Gear
					</Button>
				</CardContent>
			</Card>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Cart Items -->
				<div class="lg:col-span-2 space-y-4">
					{#each cartItems as item}
						<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
							<CardContent class="p-6">
								<div class="flex flex-col md:flex-row gap-6">
									<div class="w-full md:w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
										{#if item.photos && item.photos.length > 0}
											<img 
												src={item.photos[0]} 
												alt={item.name}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<ShoppingBag class="w-8 h-8 text-gray-400" />
											</div>
										{/if}
									</div>
									
									<div class="flex-1">
										<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
											<div>
												<h3 class="text-xl font-semibold text-gray-900 mb-2">
													{item.name}
												</h3>
												<p class="text-sm text-gray-600 mb-3 line-clamp-2">
													{item.description}
												</p>
												{#if item.location}
													<div class="flex items-center gap-1 text-sm text-gray-500 mb-2">
														<MapPin class="w-4 h-4" />
														<span>{item.location}</span>
													</div>
												{/if}
												<div class="flex items-center gap-2">
													<span class="text-sm text-gray-600">Rental Period:</span>
													<div class="flex items-center gap-2">
														<Input 
															type="date" 
															class="w-auto text-sm bg-white border-gray-200"
															value={new Date().toISOString().split('T')[0]}
														/>
														<span class="text-gray-400">to</span>
														<Input 
															type="date" 
															class="w-auto text-sm bg-white border-gray-200"
															value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
														/>
													</div>
												</div>
											</div>
											
											<div class="text-right">
												<div class="text-2xl font-bold text-emerald-600 mb-4">
													${item.pricePerDay || '0'}/day
												</div>
												<div class="flex items-center gap-2 mb-4">
													<Button size="sm" variant="outline" class="w-8 h-8 p-0">
														<Minus class="w-4 h-4" />
													</Button>
													<span class="w-8 text-center">1</span>
													<Button size="sm" variant="outline" class="w-8 h-8 p-0">
														<Plus class="w-4 h-4" />
													</Button>
												</div>
												<Button 
													on:click={() => removeFromCart(item.id)}
													size="sm" 
													variant="outline" 
													class="text-red-600 hover:text-red-700 hover:bg-red-50"
												>
													<Trash2 class="w-4 h-4 mr-2" />
													Remove
												</Button>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}

					<!-- Clear Cart -->
					<div class="flex justify-end">
						<Button on:click={clearCart} variant="outline" class="text-red-600 hover:text-red-700 hover:bg-red-50">
							<Trash2 class="w-4 h-4 mr-2" />
							Clear Cart
						</Button>
					</div>
				</div>

				<!-- Order Summary -->
				<div class="lg:col-span-1">
					<Card class="bg-white/80 backdrop-blur-sm shadow-lg sticky top-8">
						<CardHeader>
							<CardTitle>Order Summary</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="space-y-2">
								{#each cartItems as item}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 truncate mr-2">{item.name}</span>
										<span class="font-medium">${item.pricePerDay || '0'}</span>
									</div>
								{/each}
							</div>
							
							<div class="border-t border-gray-200 pt-4">
								<div class="flex justify-between text-sm text-gray-600 mb-2">
									<span>Subtotal ({cartItems.length} items)</span>
									<span>${calculateTotal().toFixed(2)}</span>
								</div>
								<div class="flex justify-between text-sm text-gray-600 mb-2">
									<span>Service Fee</span>
									<span>${(calculateTotal() * 0.1).toFixed(2)}</span>
								</div>
								<div class="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
									<span>Total</span>
									<span>${(calculateTotal() * 1.1).toFixed(2)}</span>
								</div>
							</div>

							{#if user}
								<Button 
									on:click={proceedToCheckout}
									class="w-full bg-emerald-600 hover:bg-emerald-700 py-3 text-lg font-semibold"
									disabled={cartItems.length === 0}
								>
									<Calendar class="w-5 h-5 mr-2" />
									Proceed to Checkout
								</Button>
							{:else}
								<Button class="w-full bg-emerald-600 hover:bg-emerald-700 py-3 text-lg font-semibold">
									Sign In to Checkout
								</Button>
							{/if}

							<div class="text-xs text-gray-500 text-center">
								By proceeding, you agree to our Terms of Service and Privacy Policy
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		{/if}
	</div>
</div>
