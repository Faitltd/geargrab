<script lang="ts">
	import { onMount } from 'svelte';
	import { cartStore } from '$lib/stores/cart';
	import { User, Rental } from '$lib/api/entities.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { CreditCard, Shield, ArrowLeft, Calendar } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let cartItems: any[] = [];
	let user: any = null;
	let loading = false;
	let paymentData = {
		cardNumber: '',
		expiryDate: '',
		cvv: '',
		cardholderName: ''
	};

	onMount(async () => {
		try {
			user = await User.me();
			cartStore.subscribe(items => {
				cartItems = items;
				if (items.length === 0) {
					goto('/cart');
				}
			});
		} catch (error) {
			console.error('Error loading user:', error);
		}
	});

	function calculateTotal() {
		return cartItems.reduce((total, item) => total + (item.pricePerDay || 0), 0);
	}

	async function processPayment() {
		if (!user || cartItems.length === 0) return;

		loading = true;
		try {
			// Simulate payment processing
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Create rentals for each item
			for (const item of cartItems) {
				await Rental.create({
					gearItemId: item.id,
					renterId: user.id,
					ownerId: item.ownerId,
					startDate: new Date().toISOString(),
					endDate: new Date(Date.now() + 86400000).toISOString(), // 1 day later
					totalPrice: item.pricePerDay * 1.1, // Including service fee
					status: 'pending'
				});
			}

			// Clear cart
			cartStore.clear();

			// Redirect to success page
			goto('/payment-success');
		} catch (error) {
			console.error('Error processing payment:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<button on:click={() => goto('/cart')} class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
				<ArrowLeft class="w-4 h-4" />
				Back to Cart
			</button>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
			<p class="text-gray-600">Complete your gear rental</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Payment Form -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Payment Method -->
				<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<CreditCard class="w-5 h-5" />
							Payment Information
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div>
							<label for="cardNumber" class="block text-sm font-medium text-gray-700 mb-2">
								Card Number
							</label>
							<Input
								id="cardNumber"
								bind:value={paymentData.cardNumber}
								placeholder="1234 5678 9012 3456"
								class="bg-white border-gray-200"
							/>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="expiryDate" class="block text-sm font-medium text-gray-700 mb-2">
									Expiry Date
								</label>
								<Input
									id="expiryDate"
									bind:value={paymentData.expiryDate}
									placeholder="MM/YY"
									class="bg-white border-gray-200"
								/>
							</div>
							<div>
								<label for="cvv" class="block text-sm font-medium text-gray-700 mb-2">
									CVV
								</label>
								<Input
									id="cvv"
									bind:value={paymentData.cvv}
									placeholder="123"
									class="bg-white border-gray-200"
								/>
							</div>
						</div>

						<div>
							<label for="cardholderName" class="block text-sm font-medium text-gray-700 mb-2">
								Cardholder Name
							</label>
							<Input
								id="cardholderName"
								bind:value={paymentData.cardholderName}
								placeholder="John Doe"
								class="bg-white border-gray-200"
							/>
						</div>
					</CardContent>
				</Card>

				<!-- Rental Details -->
				<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Calendar class="w-5 h-5" />
							Rental Details
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
									Start Date
								</label>
								<Input
									id="startDate"
									type="date"
									value={new Date().toISOString().split('T')[0]}
									class="bg-white border-gray-200"
								/>
							</div>
							<div>
								<label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
									End Date
								</label>
								<Input
									id="endDate"
									type="date"
									value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
									class="bg-white border-gray-200"
								/>
							</div>
						</div>

						<div>
							<label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
								Special Instructions (Optional)
							</label>
							<textarea
								id="notes"
								placeholder="Any special requests or pickup instructions..."
								rows="3"
								class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
							></textarea>
						</div>
					</CardContent>
				</Card>

				<!-- GearGrab Guarantee -->
				<Card class="bg-emerald-50 border-emerald-200">
					<CardContent class="p-6">
						<div class="flex items-start gap-3">
							<Shield class="w-6 h-6 text-emerald-600 mt-1" />
							<div>
								<h4 class="font-semibold text-emerald-900 mb-2">Protected by GearGrab Guarantee</h4>
								<ul class="text-sm text-emerald-700 space-y-1">
									<li>• Damage protection up to $1,000</li>
									<li>• 24/7 customer support</li>
									<li>• Secure payment processing</li>
									<li>• Dispute resolution service</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Order Summary -->
			<div class="lg:col-span-1">
				<Card class="bg-white/80 backdrop-blur-sm shadow-lg sticky top-8">
					<CardHeader>
						<CardTitle>Order Summary</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-3">
							{#each cartItems as item}
								<div class="flex gap-3">
									<div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
										{#if item.photos && item.photos.length > 0}
											<img 
												src={item.photos[0]} 
												alt={item.name}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<CreditCard class="w-6 h-6 text-gray-400" />
											</div>
										{/if}
									</div>
									<div class="flex-1">
										<h4 class="font-medium text-gray-900 text-sm">{item.name}</h4>
										<p class="text-xs text-gray-600">1 day rental</p>
										<p class="text-sm font-medium text-emerald-600">${item.pricePerDay || '0'}</p>
									</div>
								</div>
							{/each}
						</div>
						
						<div class="border-t border-gray-200 pt-4 space-y-2">
							<div class="flex justify-between text-sm text-gray-600">
								<span>Subtotal ({cartItems.length} items)</span>
								<span>${calculateTotal().toFixed(2)}</span>
							</div>
							<div class="flex justify-between text-sm text-gray-600">
								<span>Service Fee (10%)</span>
								<span>${(calculateTotal() * 0.1).toFixed(2)}</span>
							</div>
							<div class="flex justify-between text-sm text-gray-600">
								<span>Processing Fee</span>
								<span>$2.99</span>
							</div>
							<div class="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
								<span>Total</span>
								<span>${(calculateTotal() * 1.1 + 2.99).toFixed(2)}</span>
							</div>
						</div>

						<Button 
							on:click={processPayment}
							disabled={loading || cartItems.length === 0}
							class="w-full bg-emerald-600 hover:bg-emerald-700 py-3 text-lg font-semibold"
						>
							{#if loading}
								<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
								Processing...
							{:else}
								<CreditCard class="w-5 h-5 mr-2" />
								Complete Payment
							{/if}
						</Button>

						<div class="text-xs text-gray-500 text-center">
							Your payment information is secure and encrypted
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</div>
