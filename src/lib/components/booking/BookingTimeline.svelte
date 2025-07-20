<script lang="ts">
  import type { BookingTimelineEvent } from '$lib/types/bookings';

  export let timeline: BookingTimelineEvent[];

  function formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function getEventIcon(type: string): string {
    switch (type) {
      case 'created':
        return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
      case 'confirmed':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'paid':
        return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
      case 'started':
        return 'M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1';
      case 'completed':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'cancelled':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'message':
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  function getEventColor(type: string): string {
    switch (type) {
      case 'created':
        return 'text-blue-600 bg-blue-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'started':
        return 'text-purple-600 bg-purple-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'message':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-semibold text-gray-900 mb-4">Activity Timeline</h2>
  
  <div class="flow-root">
    <ul class="-mb-8">
      {#each timeline as event, index}
        <li>
          <div class="relative pb-8">
            {#if index !== timeline.length - 1}
              <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
            {/if}
            
            <div class="relative flex space-x-3">
              <div>
                <span class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white {getEventColor(event.type)}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getEventIcon(event.type)} />
                  </svg>
                </span>
              </div>
              
              <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                <div>
                  <p class="text-sm font-medium text-gray-900">{event.title}</p>
                  {#if event.description}
                    <p class="text-sm text-gray-600 mt-1">{event.description}</p>
                  {/if}
                  <p class="text-xs text-gray-500 mt-1">
                    by {event.actor.name} ({event.actor.role})
                  </p>
                </div>
                
                <div class="text-right text-sm whitespace-nowrap text-gray-500">
                  <time datetime={event.timestamp.toISOString()}>
                    {formatDateTime(event.timestamp)}
                  </time>
                </div>
              </div>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>
