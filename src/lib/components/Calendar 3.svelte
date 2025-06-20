<!-- 
  Simple Calendar Component
  Props:
  - selectedDates: Array of date strings in YYYY-MM-DD format
  - onDateSelect: Function to call when a date is selected/deselected
  - minDate: Minimum selectable date (optional)
  - maxDate: Maximum selectable date (optional)
  - monthsToShow: Number of months to display (default: 2)
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  
  // Props
  export let selectedDates: string[] = [];
  export let minDate: Date | null = null;
  export let maxDate: Date | null = null;
  export let monthsToShow: number = 2;
  export let disablePastDates: boolean = true;
  
  // Internal state
  let currentDate = new Date();
  let calendarDates: Array<{date: Date, isCurrentMonth: boolean, isSelected: boolean, isDisabled: boolean}> = [];
  let displayMonths: Array<{month: number, year: number, dates: typeof calendarDates}> = [];
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Initialize calendar
  onMount(() => {
    generateCalendar();
  });
  
  // Watch for changes in selectedDates
  $: if (selectedDates) {
    generateCalendar();
  }
  
  // Generate calendar for current month and specified number of months
  function generateCalendar() {
    displayMonths = [];
    
    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = new Date(currentDate);
      monthDate.setMonth(currentDate.getMonth() + i);
      
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      
      displayMonths.push({
        month,
        year,
        dates: generateMonthDates(month, year)
      });
    }
  }
  
  // Generate dates for a specific month
  function generateMonthDates(month: number, year: number) {
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthDays = prevMonth.getDate();
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthDays - i);
        dates.push({
          date,
          isCurrentMonth: false,
          isSelected: isDateSelected(date),
          isDisabled: isDateDisabled(date)
        });
      }
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      dates.push({
        date,
        isCurrentMonth: true,
        isSelected: isDateSelected(date),
        isDisabled: isDateDisabled(date)
      });
    }
    
    // Add days from next month to fill the last week
    const lastDayOfWeek = lastDay.getDay();
    if (lastDayOfWeek < 6) {
      for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
        const date = new Date(year, month + 1, i);
        dates.push({
          date,
          isCurrentMonth: false,
          isSelected: isDateSelected(date),
          isDisabled: isDateDisabled(date)
        });
      }
    }
    
    return dates;
  }
  
  // Check if a date is selected
  function isDateSelected(date: Date): boolean {
    const dateString = formatDate(date);
    return selectedDates.includes(dateString);
  }
  
  // Check if a date is disabled
  function isDateDisabled(date: Date): boolean {
    // Disable past dates if specified
    if (disablePastDates) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;
    }
    
    // Check min date
    if (minDate) {
      minDate.setHours(0, 0, 0, 0);
      if (date < minDate) return true;
    }
    
    // Check max date
    if (maxDate) {
      maxDate.setHours(0, 0, 0, 0);
      if (date > maxDate) return true;
    }
    
    return false;
  }
  
  // Format date to YYYY-MM-DD
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // Handle date click
  function handleDateClick(date: Date) {
    if (isDateDisabled(date)) return;
    
    const dateString = formatDate(date);
    dispatch('dateSelect', { date: dateString });
  }
  
  // Navigate to previous month
  function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    currentDate = new Date(currentDate);
    generateCalendar();
  }
  
  // Navigate to next month
  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate = new Date(currentDate);
    generateCalendar();
  }
  
  // Get month name
  function getMonthName(month: number): string {
    return new Date(0, month).toLocaleString('default', { month: 'long' });
  }
</script>

<div class="calendar-container">
  <div class="calendar-header">
    <button type="button" class="calendar-nav-btn" on:click="{prevMonth}" aria-label="Previous month">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    </button>
    <div class="calendar-title">
      {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
    </div>
    <button type="button" class="calendar-nav-btn" on:click="{nextMonth}" aria-label="Next month">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
  
  <div class="calendars-wrapper">
    {#each displayMonths as monthData, monthIndex}
      <div class="calendar-month">
        {#if monthIndex > 0}
          <div class="calendar-month-header">
            {getMonthName(monthData.month)} {monthData.year}
          </div>
        {/if}
        
        <div class="calendar-grid">
          <!-- Day headers -->
          <div class="calendar-day-header">Sun</div>
          <div class="calendar-day-header">Mon</div>
          <div class="calendar-day-header">Tue</div>
          <div class="calendar-day-header">Wed</div>
          <div class="calendar-day-header">Thu</div>
          <div class="calendar-day-header">Fri</div>
          <div class="calendar-day-header">Sat</div>
          
          <!-- Calendar days -->
          {#each monthData.dates as { date, isCurrentMonth, isSelected, isDisabled }}
            <button
              type="button"
              class="calendar-day {isCurrentMonth ? 'current-month' : 'other-month'} {isSelected ? 'selected' : ''} {isDisabled ? 'disabled' : ''}"
              on:click={() => handleDateClick(date)}
              disabled="{isDisabled}"
              aria-label="{date.toLocaleDateString()} {isSelected ? 'selected' : ''}"
              aria-pressed="{isSelected}"
            >
              {date.getDate()}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .calendar-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    width: 100%;
  }
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .calendar-title {
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  .calendar-nav-btn {
    background: none;
    border: none;
    color: #4b5563;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
  }
  
  .calendar-nav-btn:hover {
    background-color: #f3f4f6;
  }
  
  .calendars-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  
  .calendar-month {
    flex: 1;
    min-width: 280px;
  }
  
  .calendar-month-header {
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  
  .calendar-day-header {
    text-align: center;
    font-size: 0.8rem;
    font-weight: 500;
    color: #6b7280;
    padding: 0.5rem 0;
  }
  
  .calendar-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 0.25rem;
  }
  
  .calendar-day:hover:not(.disabled) {
    background-color: #f3f4f6;
  }
  
  .calendar-day.current-month {
    color: #1f2937;
  }
  
  .calendar-day.other-month {
    color: #9ca3af;
  }
  
  .calendar-day.selected {
    background-color: #10b981;
    color: white;
  }
  
  .calendar-day.selected:hover {
    background-color: #059669;
  }
  
  .calendar-day.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
