<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  
  export let unavailableDates: Date[] = [];
  export let selectedDates: Date[] = [];
  export let minDate: Date = new Date();
  export let maxDate: Date = new Date(new Date().setMonth(new Date().getMonth() + 3));
  
  const dispatch = createEventDispatcher();
  
  let currentMonth = new Date();
  currentMonth.setDate(1); // Set to first day of month
  
  // Format date as YYYY-MM-DD for comparison
  function formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
  
  // Check if a date is unavailable
  function isUnavailable(date: Date): boolean {
    return unavailableDates.some(unavailable => 
      formatDateKey(unavailable) === formatDateKey(date)
    );
  }
  
  // Check if a date is selected
  function isSelected(date: Date): boolean {
    return selectedDates.some(selected => 
      formatDateKey(selected) === formatDateKey(date)
    );
  }
  
  // Check if a date is in the past
  function isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }
  
  // Check if a date is outside the allowed range
  function isOutOfRange(date: Date): boolean {
    return date < minDate || date > maxDate;
  }
  
  // Get days in month
  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }
  
  // Generate calendar days for current month view
  function generateCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ 
        date: new Date(year, month, -firstDay + i + 1),
        isCurrentMonth: false
      });
    }
    
    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ 
        date,
        isCurrentMonth: true,
        isUnavailable: isUnavailable(date),
        isSelected: isSelected(date),
        isPast: isPast(date),
        isOutOfRange: isOutOfRange(date)
      });
    }
    
    // Add empty cells to complete the last week if needed
    const lastDay = new Date(year, month, daysInMonth).getDay();
    if (lastDay < 6) {
      for (let i = 1; i <= 6 - lastDay; i++) {
        days.push({ 
          date: new Date(year, month, daysInMonth + i),
          isCurrentMonth: false
        });
      }
    }
    
    return days;
  }
  
  $: calendarDays = generateCalendarDays(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );
  
  function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  }
  
  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  function toggleDate(date: Date) {
    if (isPast(date) || isOutOfRange(date) || isUnavailable(date)) return;
    
    const dateKey = formatDateKey(date);
    const index = selectedDates.findIndex(d => formatDateKey(d) === dateKey);
    
    if (index >= 0) {
      // Remove date if already selected
      selectedDates = [...selectedDates.slice(0, index), ...selectedDates.slice(index + 1)];
    } else {
      // Add date if not selected
      selectedDates = [...selectedDates, date];
    }
    
    dispatch('change', { selectedDates });
  }
  
  function removeSelectedDate(date: Date) {
    const dateKey = formatDateKey(date);
    selectedDates = selectedDates.filter(d => formatDateKey(d) !== dateKey);
    dispatch('change', { selectedDates });
  }
  
  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
</script>

<div class="calendar-container">
  <!-- Selected dates display -->
  {#if selectedDates.length > 0}
    <div class="mb-4">
      <h3 class="text-sm font-medium text-gray-700 mb-2">Selected Dates:</h3>
      <div class="flex flex-wrap gap-2">
        {#each selectedDates as date}
          <div class="bg-red-100 text-red-800 text-sm rounded-full px-3 py-1 flex items-center">
            {date.toLocaleDateString()}
            <button 
              class="ml-1 focus:outline-none" 
              on:click={() => removeSelectedDate(date)}
              aria-label="Remove date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Calendar header -->
  <div class="flex justify-between items-center mb-4">
    <button class="focus:outline-none" on:click="{previousMonth}">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <h2 class="text-lg font-semibold">
      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
    </h2>
    <button class="focus:outline-none" on:click="{nextMonth}">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  </div>

  <!-- Calendar grid -->
  <div class="grid grid-cols-7 gap-1">
    {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
      <div class="text-center text-gray-500 text-xs font-medium py-1">{day}</div>
    {/each}
    {#each calendarDays as day}
      <div 
        class="calendar-day h-10 flex items-center justify-center rounded-md
        {day.isCurrentMonth ? 'current-month' : 'other-month text-gray-300'}
        {day.isSelected ? 'selected bg-red-100 text-red-800' : ''}
        {day.isUnavailable || day.isPast || day.isOutOfRange ? 'disabled cursor-not-allowed opacity-50' : 'hover:bg-gray-100 cursor-pointer'}"
        on:click={() => toggleDate(day.date)}
        aria-label="{day.date.toLocaleDateString()}"
      >
        {day.date.getDate()}
      </div>
    {/each}
  </div>
</div>

<style>
  .calendar-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .calendar-day {
    transition: all 0.2s ease;
  }
  
  .calendar-day.selected {
    font-weight: 500;
  }
  
  /* Add subtle hover effect for interactive elements */
  button:not([disabled]):hover {
    opacity: 0.8;
  }
</style>