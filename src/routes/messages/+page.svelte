<script lang="ts">
	import { onMount } from 'svelte';
	import { Message, User } from '$lib/api/entities.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { MessageSquare, Send, Search } from 'lucide-svelte';

	let messages: any[] = [];
	let conversations: any[] = [];
	let selectedConversation: any = null;
	let newMessage = '';
	let loading = true;
	let user: any = null;

	onMount(async () => {
		try {
			user = await User.me();
			if (user) {
				const allMessages = await Message.list();
				messages = allMessages || [];
				
				// Group messages into conversations
				const conversationMap = new Map();
				messages.forEach(message => {
					const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
					if (!conversationMap.has(otherUserId)) {
						conversationMap.set(otherUserId, {
							userId: otherUserId,
							messages: [],
							lastMessage: null,
							unreadCount: 0
						});
					}
					const conversation = conversationMap.get(otherUserId);
					conversation.messages.push(message);
					if (!conversation.lastMessage || new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
						conversation.lastMessage = message;
					}
					if (message.receiverId === user.id && !message.read) {
						conversation.unreadCount++;
					}
				});
				
				conversations = Array.from(conversationMap.values()).sort((a, b) => 
					new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime()
				);
			}
		} catch (error) {
			console.error('Error loading messages:', error);
		} finally {
			loading = false;
		}
	});

	async function sendMessage() {
		if (!newMessage.trim() || !selectedConversation || !user) return;

		try {
			const message = await Message.create({
				content: newMessage,
				senderId: user.id,
				receiverId: selectedConversation.userId
			});

			// Add to local state
			selectedConversation.messages.push(message);
			selectedConversation.lastMessage = message;
			newMessage = '';
		} catch (error) {
			console.error('Error sending message:', error);
		}
	}

	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString();
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
	<div class="max-w-7xl mx-auto">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
			<p class="text-gray-600">Communicate with gear owners and renters</p>
		</div>

		{#if !user}
			<Card class="bg-white/80 backdrop-blur-sm shadow-lg">
				<CardContent class="p-8 text-center">
					<MessageSquare class="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h2 class="text-xl font-semibold text-gray-600 mb-4">Sign In Required</h2>
					<p class="text-gray-500 mb-6">You need to be signed in to view messages</p>
					<Button class="bg-emerald-600 hover:bg-emerald-700">
						Sign In
					</Button>
				</CardContent>
			</Card>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
				<!-- Conversations List -->
				<div class="lg:col-span-1">
					<Card class="bg-white/80 backdrop-blur-sm shadow-lg h-full">
						<CardHeader class="pb-4">
							<div class="relative">
								<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
								<Input
									placeholder="Search conversations..."
									class="pl-10 bg-white border-gray-200"
								/>
							</div>
						</CardHeader>
						<CardContent class="p-0 overflow-y-auto">
							{#if loading}
								<div class="space-y-2 p-4">
									{#each Array(5) as _}
										<div class="flex items-center gap-3 p-3 animate-pulse">
											<div class="w-10 h-10 bg-gray-200 rounded-full"></div>
											<div class="flex-1 space-y-1">
												<div class="h-4 bg-gray-200 rounded w-3/4"></div>
												<div class="h-3 bg-gray-200 rounded w-1/2"></div>
											</div>
										</div>
									{/each}
								</div>
							{:else if conversations.length === 0}
								<div class="p-8 text-center">
									<MessageSquare class="w-12 h-12 text-gray-300 mx-auto mb-4" />
									<p class="text-gray-500">No conversations yet</p>
								</div>
							{:else}
								<div class="space-y-1">
									{#each conversations as conversation}
										<button
											on:click={() => selectedConversation = conversation}
											class={`w-full text-left p-4 hover:bg-gray-50 transition-colors duration-200 ${
												selectedConversation?.userId === conversation.userId ? 'bg-emerald-50 border-r-2 border-emerald-500' : ''
											}`}
										>
											<div class="flex items-center gap-3">
												<div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
													<span class="font-semibold text-emerald-700">
														{conversation.userId?.toString().charAt(0) || 'U'}
													</span>
												</div>
												<div class="flex-1 min-w-0">
													<div class="flex items-center justify-between">
														<h3 class="font-medium text-gray-900 truncate">
															User {conversation.userId}
														</h3>
														{#if conversation.lastMessage}
															<span class="text-xs text-gray-500">
																{formatTime(conversation.lastMessage.createdAt)}
															</span>
														{/if}
													</div>
													{#if conversation.lastMessage}
														<p class="text-sm text-gray-600 truncate">
															{conversation.lastMessage.content}
														</p>
													{/if}
												</div>
												{#if conversation.unreadCount > 0}
													<div class="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
														<span class="text-xs text-white font-medium">
															{conversation.unreadCount}
														</span>
													</div>
												{/if}
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</CardContent>
					</Card>
				</div>

				<!-- Chat Area -->
				<div class="lg:col-span-2">
					<Card class="bg-white/80 backdrop-blur-sm shadow-lg h-full flex flex-col">
						{#if selectedConversation}
							<!-- Chat Header -->
							<CardHeader class="border-b border-gray-100">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
										<span class="font-semibold text-emerald-700">
											{selectedConversation.userId?.toString().charAt(0) || 'U'}
										</span>
									</div>
									<div>
										<h3 class="font-semibold text-gray-900">User {selectedConversation.userId}</h3>
										<p class="text-sm text-gray-600">Active now</p>
									</div>
								</div>
							</CardHeader>

							<!-- Messages -->
							<CardContent class="flex-1 overflow-y-auto p-4 space-y-4">
								{#each selectedConversation.messages as message}
									<div class={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
										<div class={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
											message.senderId === user.id 
												? 'bg-emerald-500 text-white' 
												: 'bg-gray-100 text-gray-900'
										}`}>
											<p class="text-sm">{message.content}</p>
											<p class={`text-xs mt-1 ${
												message.senderId === user.id ? 'text-emerald-100' : 'text-gray-500'
											}`}>
												{formatTime(message.createdAt)}
											</p>
										</div>
									</div>
								{/each}
							</CardContent>

							<!-- Message Input -->
							<div class="border-t border-gray-100 p-4">
								<form on:submit|preventDefault={sendMessage} class="flex gap-2">
									<Input
										bind:value={newMessage}
										placeholder="Type a message..."
										class="flex-1 bg-white border-gray-200"
									/>
									<Button type="submit" size="icon" class="bg-emerald-600 hover:bg-emerald-700">
										<Send class="w-4 h-4" />
									</Button>
								</form>
							</div>
						{:else}
							<!-- No Conversation Selected -->
							<CardContent class="flex-1 flex items-center justify-center">
								<div class="text-center">
									<MessageSquare class="w-16 h-16 text-gray-300 mx-auto mb-4" />
									<h3 class="text-lg font-semibold text-gray-600 mb-2">Select a conversation</h3>
									<p class="text-gray-500">Choose a conversation from the list to start messaging</p>
								</div>
							</CardContent>
						{/if}
					</Card>
				</div>
			</div>
		{/if}
	</div>
</div>
