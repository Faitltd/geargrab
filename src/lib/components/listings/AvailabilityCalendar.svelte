<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let selectedDates: string[] = [];
  export let disabled = false;
  
  const dispatch = createEventDispatcher<{
    datesChange: { dates: string[] };
  }>();
  
  let currentMonth = new Date();
  let today = new Date();
  
  // Calendar navigation
  const previousMonth = () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  };
  
  const nextMonth = () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  };
  
  // Get calendar data
  $: monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  $: firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  $: lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  $: startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  $: calendarDays = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const isDateSelected = (date: Date): boolean => {
    return selectedDates.includes(formatDate(date));
  };
  
  const isDateInCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  const isDatePast = (date: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly < todayOnly;
  };
  
  const toggleDate = (date: Date) => {
    if (disabled || isDatePast(date)) return;
    
    const dateStr = formatDate(date);
    let newDates;
    
    if (selectedDates.includes(dateStr)) {
      newDates = selectedDates.filter(d => d !== dateStr);
    } else {
      newDates = [...selectedDates, dateStr].sort();
    }
    
    selectedDates = newDates;
    dispatch('datesChange', { dates: newDates });
  };
  
  const clearDates = () => {
    selectedDates = [];
    dispatch('datesChange', { dates: [] });
  };
</script>

<div class="bg-white rounded-lg border border-neutral-200 p-4">
  <!-- Calendar Header -->
  <div class="flex items-center justify-between mb-4">
    <button
      type="button"
      on:click={previousMonth}
      disabled={disabled}
      class="p-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Previous month"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <h3 class="text-lg font-semibold text-neutral-900">{monthName}</h3>
    
    <button
      type="button"
      on:click={nextMonth}
      disabled={disabled}
      class="p-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Next month"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
  
  <!-- Day Headers -->
  <div class="grid grid-cols-7 gap-1 mb-2">
    {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
      <div class="text-center text-xs font-medium text-neutral-500 py-2">
        {day}
      </div>
    {/each}
  </div>
  
  <!-- Calendar Grid -->
  <div class="grid grid-cols-7 gap-1">
    {#each calendarDays as date}
      {@const isSelected = isDateSelected(date)}
      {@const isCurrentMonth = isDateInCurrentMonth(date)}
      {@const isPast = isDatePast(date)}
      {@const isToday = formatDate(date) === formatDate(today)}
      
      <button
        type="button"
        on:click={() => toggleDate(date)}
        disabled={disabled || isPast}
        class="
          relative h-10 text-sm rounded-lg transition-all duration-200
          {isCurrentMonth ? 'text-neutral-900' : 'text-neutral-400'}
          {isSelected 
            ? 'bg-primary-500 text-white font-medium' 
            : isPast 
              ? 'text-neutral-300 cursor-not-allowed' 
              : 'hover:bg-primary-50 hover:text-primary-600'
          }
          {isToday && !isSelected ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label="Toggle {date.toLocaleDateString()}"
      >
        {date.getDate()}
        {#if isToday && !isSelected}
          <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></div>
        {/if}
      </button>
    {/each}
  </div>
  
  <!-- Selected Dates Summary -->
  {#if selectedDates.length > 0}
    <div class="mt-4 pt-4 border-t border-neutral-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-neutral-700">
            {selectedDates.length} date{selectedDates.length === 1 ? '' : 's'} selected
          </p>
          {#if selectedDates.length <= 3}
            <p class="text-xs text-neutral-500 mt-1">
              {selectedDates.map(date => new Date(date).toLocaleDateString()).join(', ')}
            </p>
          {:else}
            <p class="text-xs text-neutral-500 mt-1">
              {new Date(selectedDates[0]).toLocaleDateString()} - {new Date(selectedDates[selectedDates.length - 1]).toLocaleDateString()} and {selectedDates.length - 2} more
            </p>
          {/if}
        </div>
        
        <button
          type="button"
          on:click={clearDates}
          disabled={disabled}
          class="text-xs text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  {/if}
</div>
