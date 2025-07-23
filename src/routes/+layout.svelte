<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { Mountain, Search, Plus, User, MessageSquare, Calendar, ShoppingBag } from 'lucide-svelte';
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarHeader,
		SidebarProvider,
		SidebarTrigger,
	} from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { cartCount } from '$lib/stores/cart';
	import { createPageUrl } from '$lib/utils';


	const navigationItems = [
		{
			title: "Browse Gear",
			url: createPageUrl("browse"),
			icon: Search,
		},
		{
			title: "My Rentals",
			url: createPageUrl("my-rentals"),
			icon: Calendar,
		},
		{
			title: "List Gear",
			url: createPageUrl("list-gear"),
			icon: Plus,
		},
		{
			title: "Messages",
			url: createPageUrl("messages"),
			icon: MessageSquare,
		},
		{
			title: "Profile",
			url: createPageUrl("profile"),
			icon: User,
		},
	];
</script>

<SidebarProvider>
	<style>
		:global(.sidebar-provider) {
			min-height: 100vh;
			display: flex;
			width: 100%;
			background: linear-gradient(to bottom right, rgb(248 250 252), rgb(255 255 255), rgb(240 253 244));
		}
	</style>

	<div class="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-green-50">
		<Sidebar class="border-r border-gray-100 shadow-sm">
			<SidebarHeader class="border-b border-gray-100 p-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
							<Mountain class="w-6 h-6 text-white" />
						</div>
						<div>
							<h2 class="font-bold text-xl text-gray-900">GearGrab</h2>
							<p class="text-xs text-gray-500 font-medium">Outdoor Gear Rental</p>
						</div>
					</div>
					<div>
						<a href="/cart">
							<Button variant="ghost" size="icon" class="relative hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200">
								<ShoppingBag class="w-5 h-5" />
								{#if $cartCount > 0}
									<Badge variant="destructive" class="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
										{$cartCount}
									</Badge>
								{/if}
							</Button>
						</a>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent class="p-3">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu class="space-y-1">
							{#each navigationItems as item}
								<SidebarMenuItem>
									<a href={item.url}>
										<SidebarMenuButton
											class={`hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-xl px-4 py-3 font-medium ${
												$page.url.pathname === item.url
													? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
													: 'text-gray-700'
											}`}
										>
											<svelte:component this={item.icon} class="w-5 h-5" />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</a>
								</SidebarMenuItem>
							{/each}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>

		<main class="flex-1 flex flex-col">
			<header class="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4 md:hidden sticky top-0 z-40">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<SidebarTrigger class="hover:bg-gray-100 p-2 rounded-xl transition-colors duration-200" />
						<div class="flex items-center gap-2">
							<Mountain class="w-6 h-6 text-emerald-600" />
							<h1 class="text-xl font-bold text-gray-900">GearGrab</h1>
						</div>
					</div>
					<div>
						<a href="/cart">
							<Button variant="ghost" size="icon" class="relative hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200">
								<ShoppingBag class="w-5 h-5" />
								{#if $cartCount > 0}
									<Badge variant="destructive" class="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
										{$cartCount}
									</Badge>
								{/if}
							</Button>
						</a>
					</div>
				</div>
			</header>

			<div class="flex-1 overflow-auto">
				<slot />
			</div>
		</main>
	</div>
</SidebarProvider>
