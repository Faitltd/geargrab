<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { bookingsService } from '$lib/services/bookings.service';
  import type { DateRange, CalendarMonth, CalendarDay } from '$lib/types/bookings';

  export let listingId: string;
  export let minDate: Date = new Date();

  const dispatch = createEventDispatcher<{
    dateRangeChange: DateRange;
  }>();

  let selectedRange: DateRange = { start: null, end: null, totalDays: 0 };
  let currentMonth = new Date();
  let nextMonth = new Date();
  let unavailableDates: Set<string> = new Set();
  let loading = false;

  // Initialize months
  onMount(() => {
    currentMonth.setDate(1);
    nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    loadUnavailableDates();
  });

  async function loadUnavailableDates() {
    try {
      loading = true;
      
      // Get bookings for the next 6 months to determine unavailable dates
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      
      const { bookings } = await bookingsService.getBookings({
        listingId,
        limit: 100
      });

      // Build set of unavailable dates
      const unavailable = new Set<string>();
      
      bookings.forEach(booking => {
        if (['confirmed', 'paid', 'active'].includes(booking.status)) {
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          
          // Add all dates in the booking range
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            unavailable.add(d.toISOString().split('T')[0]);
          }
        }
      });

      unavailableDates = unavailable;
    } catch (error) {
      console.error('Error loading unavailable dates:', error);
    } finally {
      loading = false;
    }
  }

  function generateCalendarMonth(date: Date): CalendarMonth {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) { // 6 weeks
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateString = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.getTime() === today.getTime();
      const isPast = currentDate < minDate;
      const isUnavailable = unavailableDates.has(dateString);
      const isSelected = selectedRange.start && currentDate.getTime() === selectedRange.start.getTime() ||
                        selectedRange.end && currentDate.getTime() === selectedRange.end.getTime();
      const isInRange = selectedRange.start && selectedRange.end &&
                       currentDate > selectedRange.start && currentDate < selectedRange.end;

      days.push({
        date: currentDate,
        available: isCurrentMonth && !isPast && !isUnavailable,
        isToday,
        isSelected,
        isInRange,
        isBlocked: isPast || isUnavailable,
        reason: isPast ? 'Past date' : isUnavailable ? 'Unavailable' : undefined
      });
    }

    return {
      year,
      month,
      days,
      name: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }

  function handleDateClick(day: CalendarDay) {
    if (!day.available) return;

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start new selection
      selectedRange = { start: day.date, end: null, totalDays: 0 };
    } else if (selectedRange.start && !selectedRange.end) {
      // Complete selection
      if (day.date > selectedRange.start) {
        selectedRange.end = day.date;
        selectedRange.totalDays = Math.ceil((day.date.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // If clicked date is before start, make it the new start
        selectedRange = { start: day.date, end: null, totalDays: 0 };
      }
    }

    // Dispatch the change
    dispatch('dateRangeChange', selectedRange);
  }

  function navigateMonth(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      nextMonth.setMonth(nextMonth.getMonth() - 1);
    } else {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
    }
    
    // Trigger reactivity
    currentMonth = new Date(currentMonth);
    nextMonth = new Date(nextMonth);
  }

  function clearSelection() {
    selectedRange = { start: null, end: null, totalDays: 0 };
    dispatch('dateRangeChange', selectedRange);
  }

  $: currentCalendar = generateCalendarMonth(currentMonth);
  $: nextCalendar = generateCalendarMonth(nextMonth);
</script>

<div class="space-y-4">
  <!-- Selected Range Display -->
  {#if selectedRange.start}
    <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-primary-900">
            {#if selectedRange.end}
              {selectedRange.start.toLocaleDateString()} - {selectedRange.end.toLocaleDateString()}
              <span class="text-primary-600">({selectedRange.totalDays} day{selectedRange.totalDays > 1 ? 's' : ''})</span>
            {:else}
              Check-in: {selectedRange.start.toLocaleDateString()}
              <span class="text-primary-600">(Select check-out date)</span>
            {/if}
          </p>
        </div>
        <button
          on:click={clearSelection}
          class="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          Clear
        </button>
      </div>
    </div>
  {/if}

  <!-- Calendar Navigation -->
  <div class="flex items-center justify-between">
    <button
      on:click={() => navigateMonth('prev')}
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <div class="flex space-x-8">
      <h3 class="text-lg font-semibold text-gray-900">{currentCalendar.name}</h3>
      <h3 class="text-lg font-semibold text-gray-900">{nextCalendar.name}</h3>
    </div>
    
    <button
      on:click={() => navigateMonth('next')}
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>

  <!-- Calendar Grid -->
  <div class="grid grid-cols-2 gap-8">
    <!-- Current Month -->
    <div>
      <!-- Day Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        {#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
          <div class="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        {/each}
      </div>

      <!-- Days Grid -->
      <div class="grid grid-cols-7 gap-1">
        {#each currentCalendar.days as day}
          <button
            on:click={() => handleDateClick(day)}
            disabled={!day.available}
            class="aspect-square flex items-center justify-center text-sm rounded-lg transition-colors relative {day.date.getMonth() !== currentCalendar.month ? 'text-gray-300' : ''} {day.available ? 'hover:bg-primary-100 cursor-pointer' : 'cursor-not-allowed'} {day.isToday ? 'bg-blue-100 text-blue-900 font-semibold' : ''} {day.isSelected ? 'bg-primary-500 text-white font-semibold' : ''} {day.isInRange ? 'bg-primary-200 text-primary-900' : ''} {day.isBlocked ? 'bg-gray-100 text-gray-400 line-through' : ''}"
            title={day.reason}
          >
            {day.date.getDate()}
          </button>
        {/each}
      </div>
    </div>

    <!-- Next Month -->
    <div>
      <!-- Day Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        {#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
          <div class="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        {/each}
      </div>

      <!-- Days Grid -->
      <div class="grid grid-cols-7 gap-1">
        {#each nextCalendar.days as day}
          <button
            on:click={() => handleDateClick(day)}
            disabled={!day.available}
            class="aspect-square flex items-center justify-center text-sm rounded-lg transition-colors relative {day.date.getMonth() !== nextCalendar.month ? 'text-gray-300' : ''} {day.available ? 'hover:bg-primary-100 cursor-pointer' : 'cursor-not-allowed'} {day.isToday ? 'bg-blue-100 text-blue-900 font-semibold' : ''} {day.isSelected ? 'bg-primary-500 text-white font-semibold' : ''} {day.isInRange ? 'bg-primary-200 text-primary-900' : ''} {day.isBlocked ? 'bg-gray-100 text-gray-400 line-through' : ''}"
            title={day.reason}
          >
            {day.date.getDate()}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Legend -->
  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
    <div class="flex items-center">
      <div class="w-4 h-4 bg-primary-500 rounded mr-2"></div>
      <span>Selected</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 bg-primary-200 rounded mr-2"></div>
      <span>In range</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 bg-gray-100 rounded mr-2"></div>
      <span>Unavailable</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 bg-blue-100 rounded mr-2"></div>
      <span>Today</span>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-4">
      <div class="inline-flex items-center text-sm text-gray-600">
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading availability...
      </div>
    </div>
  {/if}
</div>
