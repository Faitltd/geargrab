<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let healthData: any = null;

	onMount(async () => {
		try {
			const response = await fetch('/health');
			healthData = await response.json();
		} catch (error) {
			console.error('Health check failed:', error);
		}
	});
</script>

<svelte:head>
	<title>Health Check - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">System Health Check</h1>
		
		{#if healthData}
			<div class="bg-white rounded-lg shadow-lg p-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h2 class="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
						<div class="space-y-2">
							<div class="flex justify-between">
								<span class="text-gray-600">Status:</span>
								<span class="text-green-600 font-semibold">{healthData.status}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Environment:</span>
								<span class="font-semibold">{healthData.environment}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Version:</span>
								<span class="font-semibold">{healthData.version}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Uptime:</span>
								<span class="font-semibold">{Math.floor(healthData.uptime)}s</span>
							</div>
						</div>
					</div>
					
					<div>
						<h2 class="text-xl font-semibold text-gray-800 mb-4">Services</h2>
						<div class="space-y-2">
							{#each Object.entries(healthData.services) as [service, status]}
								<div class="flex justify-between">
									<span class="text-gray-600 capitalize">{service}:</span>
									<span class="text-green-600 font-semibold">{status}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
				
				<div class="mt-6 pt-6 border-t border-gray-200">
					<p class="text-sm text-gray-500">
						Last checked: {new Date(healthData.timestamp).toLocaleString()}
					</p>
				</div>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow-lg p-6">
				<div class="animate-pulse">
					<div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
					<div class="space-y-2">
						<div class="h-4 bg-gray-200 rounded"></div>
						<div class="h-4 bg-gray-200 rounded w-3/4"></div>
						<div class="h-4 bg-gray-200 rounded w-1/2"></div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
