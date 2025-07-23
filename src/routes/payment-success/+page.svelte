<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { CheckCircle, Calendar, MessageSquare, Download } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { createPageUrl } from '$lib/utils';
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-4xl mx-auto">
		<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
			<CardContent class="p-12 text-center">
				<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<CheckCircle class="w-12 h-12 text-green-600" />
				</div>
				
				<h1 class="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
				<p class="text-lg text-gray-600 mb-8">
					Your gear rental has been confirmed. You'll receive a confirmation email shortly.
				</p>

				<div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
					<h2 class="text-lg font-semibold text-emerald-900 mb-4">What's Next?</h2>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div class="flex flex-col items-center text-center">
							<div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
								<MessageSquare class="w-6 h-6 text-emerald-600" />
							</div>
							<h3 class="font-medium text-emerald-900 mb-1">Contact Owner</h3>
							<p class="text-emerald-700">Coordinate pickup details with the gear owner</p>
						</div>
						<div class="flex flex-col items-center text-center">
							<div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
								<Calendar class="w-6 h-6 text-emerald-600" />
							</div>
							<h3 class="font-medium text-emerald-900 mb-1">Pickup Gear</h3>
							<p class="text-emerald-700">Meet at the agreed location and time</p>
						</div>
						<div class="flex flex-col items-center text-center">
							<div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
								<Download class="w-6 h-6 text-emerald-600" />
							</div>
							<h3 class="font-medium text-emerald-900 mb-1">Enjoy & Return</h3>
							<p class="text-emerald-700">Have your adventure and return in good condition</p>
						</div>
					</div>
				</div>

				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<Button 
						on:click={() => goto(createPageUrl('my-rentals'))}
						class="bg-emerald-600 hover:bg-emerald-700"
					>
						<Calendar class="w-4 h-4 mr-2" />
						View My Rentals
					</Button>
					<Button 
						on:click={() => goto('/')}
						variant="outline"
					>
						Continue Browsing
					</Button>
				</div>

				<div class="mt-8 pt-8 border-t border-gray-200">
					<p class="text-sm text-gray-500">
						Need help? Contact our support team at 
						<a href="mailto:support@geargrab.com" class="text-emerald-600 hover:text-emerald-700">
							support@geargrab.com
						</a>
					</p>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
