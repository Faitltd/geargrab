<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let selectedDates: string[] = [];
  export let availableDates: string[] = [];
  export let minDate: Date = new Date();
  export let maxDate: Date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
  export let disabled = false;
  export let allowMultiple = true;
  export let showAvailabilityOnly = true;
  
  const dispatch = createEventDispatcher<{
    dateSelect: { dates: string[]; startDate: string | null; endDate: string | null };
    dateChange: { dates: string[] };
  }>();
  
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let isSelectingRange = false;
  let rangeStart: string | null = null;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  $: calendarDays = generateCalendarDays(currentYear, currentMonth);
  $: startDate = selectedDates.length > 0 ? selectedDates[0] : null;
  $: endDate = selectedDates.length > 1 ? selectedDates[selectedDates.length - 1] : null;
  
  function generateCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 6 weeks of days
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = formatDate(current);
        const isCurrentMonth = current.getMonth() === month;
        const isToday = formatDate(new Date()) === dateStr;
        const isSelected = selectedDates.includes(dateStr);
        const isAvailable = availableDates.length === 0 || availableDates.includes(dateStr);
        const isDisabled = current < minDate || current > maxDate || !isAvailable;
        const isInRange = isDateInRange(dateStr);
        
        days.push({
          date: new Date(current),
          dateStr,
          day: current.getDate(),
          isCurrentMonth,
          isToday,
          isSelected,
          isAvailable,
          isDisabled,
          isInRange
        });
        
        current.setDate(current.getDate() + 1);
      }
    }
    
    return days;
  }
  
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  function isDateInRange(dateStr: string): boolean {
    if (!rangeStart || !isSelectingRange) return false;
    
    const date = new Date(dateStr);
    const start = new Date(rangeStart);
    const today = new Date();
    
    return date >= start && date >= today;
  }
  
  function handleDateClick(day: typeof calendarDays[0]) {
    if (disabled || day.isDisabled) return;
    
    const dateStr = day.dateStr;
    
    if (!allowMultiple) {
      selectedDates = [dateStr];
    } else if (isSelectingRange && rangeStart) {
      // Complete range selection
      const start = new Date(rangeStart);
      const end = new Date(dateStr);
      
      if (end >= start) {
        const rangeDates = [];
        const current = new Date(start);
        
        while (current <= end) {
          const currentStr = formatDate(current);
          if (availableDates.length === 0 || availableDates.includes(currentStr)) {
            rangeDates.push(currentStr);
          }
          current.setDate(current.getDate() + 1);
        }
        
        selectedDates = rangeDates;
      } else {
        selectedDates = [dateStr];
      }
      
      isSelectingRange = false;
      rangeStart = null;
    } else {
      // Start range selection or toggle single date
      if (selectedDates.includes(dateStr)) {
        selectedDates = selectedDates.filter(d => d !== dateStr);
      } else {
        if (selectedDates.length === 0) {
          selectedDates = [dateStr];
          rangeStart = dateStr;
          isSelectingRange = true;
        } else {
          selectedDates = [...selectedDates, dateStr].sort();
        }
      }
    }
    
    dispatch('dateSelect', {
      dates: selectedDates,
      startDate,
      endDate
    });
    
    dispatch('dateChange', { dates: selectedDates });
  }
  
  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }
  
  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }
  
  function clearSelection() {
    selectedDates = [];
    isSelectingRange = false;
    rangeStart = null;
    dispatch('dateChange', { dates: [] });
  }
  
  function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
  }
</script>

<!-- Rental Date Picker -->
<div class="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-lg font-semibold text-neutral-900">
      Select Rental Dates
    </h3>
    
    {#if selectedDates.length > 0}
      <button
        on:click={clearSelection}
        class="text-sm text-primary-500 hover:text-primary-600 font-medium"
      >
        Clear Selection
      </button>
    {/if}
  </div>
  
  <!-- Calendar Navigation -->
  <div class="flex items-center justify-between mb-6">
    <button
      on:click={previousMonth}
      class="p-2 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label="Previous month"
    >
      <svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <div class="flex items-center space-x-4">
      <h4 class="text-lg font-semibold text-neutral-900">
        {monthNames[currentMonth]} {currentYear}
      </h4>
      
      <button
        on:click={goToToday}
        class="text-sm text-primary-500 hover:text-primary-600 font-medium px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
      >
        Today
      </button>
    </div>
    
    <button
      on:click={nextMonth}
      class="p-2 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label="Next month"
    >
      <svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
  
  <!-- Calendar Grid -->
  <div class="grid grid-cols-7 gap-1 mb-4">
    <!-- Day Headers -->
    {#each dayNames as dayName}
      <div class="p-2 text-center text-sm font-medium text-neutral-500">
        {dayName}
      </div>
    {/each}
    
    <!-- Calendar Days -->
    {#each calendarDays as day}
      <button
        type="button"
        disabled={day.isDisabled || disabled}
        class="
          relative p-2 text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500
          {day.isCurrentMonth ? 'text-neutral-900' : 'text-neutral-400'}
          {day.isToday ? 'ring-2 ring-primary-200' : ''}
          {day.isSelected 
            ? 'bg-primary-500 text-white font-semibold' 
            : day.isInRange 
              ? 'bg-primary-100 text-primary-700'
              : day.isDisabled 
                ? 'text-neutral-300 cursor-not-allowed'
                : 'hover:bg-neutral-100'
          }
          {!day.isAvailable && showAvailabilityOnly ? 'opacity-50' : ''}
        "
        on:click={() => handleDateClick(day)}
        aria-label="Select {day.date.toLocaleDateString()}"
      >
        {day.day}
        
        <!-- Today indicator -->
        {#if day.isToday && !day.isSelected}
          <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></div>
        {/if}
        
        <!-- Availability indicator -->
        {#if !day.isAvailable && day.isCurrentMonth}
          <div class="absolute top-1 right-1 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
        {/if}
      </button>
    {/each}
  </div>
  
  <!-- Selection Summary -->
  {#if selectedDates.length > 0}
    <div class="bg-primary-50 rounded-lg p-4 border border-primary-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-primary-800 mb-1">
            Selected Dates
          </p>
          <p class="text-sm text-primary-700">
            {#if selectedDates.length === 1}
              {new Date(selectedDates[0]).toLocaleDateString()}
            {:else if selectedDates.length === 2}
              {new Date(selectedDates[0]).toLocaleDateString()} - {new Date(selectedDates[selectedDates.length - 1]).toLocaleDateString()}
            {:else}
              {selectedDates.length} days selected
            {/if}
          </p>
        </div>
        
        <div class="text-right">
          <p class="text-sm font-medium text-primary-800">
            {selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Instructions -->
  <div class="mt-4 text-sm text-neutral-600">
    {#if allowMultiple}
      <p>Click a date to start, then click another date to select a range.</p>
    {:else}
      <p>Click a date to select it for rental.</p>
    {/if}
    
    {#if showAvailabilityOnly && availableDates.length > 0}
      <p class="mt-1">Only available dates can be selected.</p>
    {/if}
  </div>
</div>
