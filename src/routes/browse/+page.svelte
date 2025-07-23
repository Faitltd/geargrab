<script lang="ts">
	// This is the same as the home page - redirect to home
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/');
	});
</script>

<!-- This page redirects to home -->
