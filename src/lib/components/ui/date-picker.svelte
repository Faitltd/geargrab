<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let startDate: Date  = null;
  export let endDate: Date  = null;
  export let placeholder = 'Select dates';
  export let disabled = false;
  export let minDate: Date  = new Date(); // Default to today

  const dispatch = createEventDispatcher<{
    change: { startDate: Date ; endDate: Date  };
  }>();

  let showCalendar = false;
  let currentMonth = new Date();
  let selectingStart = true;

  // Format date for display
  function formatDate(date: Date ) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Get display text for the input
  function getDisplayText() {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `${formatDate(startDate)} - Select end date`;
    }
    return placeholder;
  }

  // Calculate number of days between dates
  function getDaysBetween(start: Date, end: Date) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if date is disabled
  function isDateDisabled(date: Date) {
    if (minDate && date < minDate) return true;
    return false;
  }

  // Check if date is in range
  function isDateInRange(date: Date) {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  }

  // Check if date is selected
  function isDateSelected(date: Date) {
    if (startDate && isSameDay(date, startDate)) return true;
    if (endDate && isSameDay(date, endDate)) return true;
    return false;
  }

  // Check if two dates are the same day
  function isSameDay(date1: Date, date2: Date) {
    return date1.toDateString() === date2.toDateString();
  }

  // Handle date selection
  function selectDate(date: Date) {
    if (isDateDisabled(date)) return;

    if (selectingStart || !startDate) {
      startDate = date;
      endDate = null;
      selectingStart = false;
    } else {
      if (date < startDate) {
        // If selected date is before start date, swap them
        endDate = startDate;
        startDate = date;
      } else {
        endDate = date;
      }
      selectingStart = true;
      showCalendar = false;
    }

    dispatch('change', { startDate, endDate });
  }

  // Navigate months
  function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  }

  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }

  // Get calendar days for current month
  function getCalendarDays(): Array<{ date: Date; isCurrentMonth }> {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: Array<{ date: Date; isCurrentMonth }> = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  // Clear selection
  function clearDates() {
    startDate = null;
    endDate = null;
    selectingStart = true;
    dispatch('change', { startDate, endDate });
  }

  // Quick date presets
  function setPreset(days) {
    const today = new Date();
    startDate = new Date(today);
    endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days - 1);
    selectingStart = true;
    showCalendar = false;
    dispatch('change', { startDate, endDate });
  }

  $: calendarDays = getCalendarDays();
  $: monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  $: dayCount = startDate && endDate ? getDaysBetween(startDate, endDate) + 1 : 0;
</script>

<div class="date-picker" class:disabled>
  <!-- Date Input Display -->
  <button
    type="button"
    on:click={() => showCalendar = !showCalendar}
    class="date-input"
    {disabled}
  >
    <div class="date-text">
      {getDisplayText()}
    </div>
    <div class="date-icons">
      {#if startDate || endDate}
        <button
          type="button"
          on:click|stopPropagation={clearDates}
          class="clear-button"
          title="Clear dates"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      <svg class="calendar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  </button>

  <!-- Calendar Dropdown -->
  {#if showCalendar}
    <div class="calendar-dropdown">
      <!-- Quick Presets -->
      <div class="presets">
        <button on:click={() => setPreset(1)} class="preset-button">Today</button>
        <button on:click={() => setPreset(2)} class="preset-button">2 Days</button>
        <button on:click={() => setPreset(7)} class="preset-button">1 Week</button>
        <button on:click={() => setPreset(14)} class="preset-button">2 Weeks</button>
      </div>

      <!-- Calendar Header -->
      <div class="calendar-header">
        <button on:click={previousMonth} class="nav-button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 class="month-title">{monthName}</h3>
        <button on:click={nextMonth} class="nav-button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Day Headers -->
      <div class="day-headers">
        {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
          <div class="day-header">{day}</div>
        {/each}
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        {#each calendarDays as { date, isCurrentMonth }}
          <button
            type="button"
            on:click={() => selectDate(date)}
            class="calendar-day"
            class:current-month={isCurrentMonth}
            class:disabled={isDateDisabled(date)}
            class:selected={isDateSelected(date)}
            class:in-range={isDateInRange(date)}
            class:start-date={startDate && isSameDay(date, startDate)}
            class:end-date={endDate && isSameDay(date, endDate)}
            disabled={isDateDisabled(date)}
          >
            {date.getDate()}
          </button>
        {/each}
      </div>

      <!-- Selection Info -->
      {#if dayCount > 0}
        <div class="selection-info">
          <span class="day-count">{dayCount} day{dayCount !== 1 ? 's' : ''} selected</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .date-picker {
    position: relative;
    width: 100%;
  }

  .date-picker.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .date-input {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .date-input:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }

  .date-input:focus {
    outline: none;
    border-color: #10b981;
  }

  .date-text {
    flex: 1;
    text-align: left;
    font-size: 0.875rem;
  }

  .date-icons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .clear-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .clear-button:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .calendar-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .calendar-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    margin-top: 0.25rem;
    padding: 1rem;
    z-index: 50;
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }

  .presets {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .preset-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    padding: 0.5rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preset-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .nav-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .month-title {
    font-size: 1rem;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .day-header {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    padding: 0.5rem 0;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
  }

  .calendar-day {
    aspect-ratio: 1;
    background: none;
    border: 1px solid transparent;
    color: rgba(255, 255, 255, 0.4);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .calendar-day.current-month {
    color: white;
  }

  .calendar-day.current-month:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  .calendar-day.disabled {
    color: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
  }

  .calendar-day.selected {
    background: #10b981;
    color: white;
    border-color: #10b981;
  }

  .calendar-day.in-range {
    background: rgba(16, 185, 129, 0.2);
    color: white;
  }

  .calendar-day.start-date,
  .calendar-day.end-date {
    background: #10b981;
    color: white;
  }

  .selection-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
  }

  .day-count {
    font-size: 0.875rem;
    color: #10b981;
    font-weight: 500;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .calendar-dropdown {
      left: -1rem;
      right: -1rem;
      padding: 0.75rem;
    }

    .presets {
      grid-template-columns: repeat(2, 1fr);
    }

    .calendar-day {
      font-size: 0.75rem;
    }

    .day-header {
      font-size: 0.6875rem;
    }
  }
</style>
