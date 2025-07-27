<script>
  import { createEventDispatcher } from 'svelte';
  
  export let unavailableDates = [];
  export let bookedDates = [];
  export let selectedStartDate = null;
  export let selectedEndDate = null;
  export let minDate = null;
  export let maxDate = null;
  
  const dispatch = createEventDispatcher();
  
  let currentMonth = new Date();
  let isSelectingRange = false;
  
  // Set default min/max dates if not provided
  if (!minDate) {
    minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
  }
  
  if (!maxDate) {
    maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
  }
  
  function getMonthName(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  
  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }
  
  function isDateUnavailable(date) {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    return unavailableDates.includes(dateString);
  }
  
  function isDateBooked(date) {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    return bookedDates.includes(dateString);
  }
  
  function isDateDisabled(date) {
    if (!date) return true;
    return date < minDate || date > maxDate || isDateUnavailable(date) || isDateBooked(date);
  }
  
  function isDateSelected(date) {
    if (!date || (!selectedStartDate && !selectedEndDate)) return false;
    
    const dateTime = date.getTime();
    const startTime = selectedStartDate?.getTime();
    const endTime = selectedEndDate?.getTime();
    
    if (startTime && endTime) {
      return dateTime >= startTime && dateTime <= endTime;
    } else if (startTime) {
      return dateTime === startTime;
    }
    
    return false;
  }
  
  function isDateInRange(date) {
    if (!date || !selectedStartDate || !selectedEndDate) return false;
    
    const dateTime = date.getTime();
    const startTime = selectedStartDate.getTime();
    const endTime = selectedEndDate.getTime();
    
    return dateTime > startTime && dateTime < endTime;
  }
  
  function handleDateClick(date) {
    if (isDateDisabled(date)) return;
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      selectedStartDate = date;
      selectedEndDate = null;
      isSelectingRange = true;
    } else if (selectedStartDate && !selectedEndDate) {
      // Complete selection
      if (date < selectedStartDate) {
        selectedEndDate = selectedStartDate;
        selectedStartDate = date;
      } else {
        selectedEndDate = date;
      }
      isSelectingRange = false;
      
      // Check if any dates in the range are unavailable
      const start = selectedStartDate;
      const end = selectedEndDate;
      let hasUnavailableDates = false;
      
      const currentDate = new Date(start);
      while (currentDate <= end) {
        if (isDateUnavailable(currentDate) || isDateBooked(currentDate)) {
          hasUnavailableDates = true;
          break;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (hasUnavailableDates) {
        // Reset selection if range contains unavailable dates
        selectedStartDate = date;
        selectedEndDate = null;
        isSelectingRange = true;
        dispatch('date-error', { message: 'Selected range contains unavailable dates' });
      } else {
        dispatch('date-range-selected', {
          startDate: selectedStartDate,
          endDate: selectedEndDate
        });
      }
    }
  }
  
  function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  }
  
  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  function clearSelection() {
    selectedStartDate = null;
    selectedEndDate = null;
    isSelectingRange = false;
    dispatch('date-range-cleared');
  }
  
  $: days = getDaysInMonth(currentMonth);
  $: canGoPrevious = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1) >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  $: canGoNext = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900">Select Dates</h3>
    {#if selectedStartDate || selectedEndDate}
      <button
        on:click={clearSelection}
        class="text-sm text-gray-600 hover:text-gray-800"
      >
        Clear Selection
      </button>
    {/if}
  </div>
  
  <!-- Calendar Header -->
  <div class="flex items-center justify-between mb-4">
    <button
      on:click={previousMonth}
      disabled={!canGoPrevious}
      class="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    
    <h4 class="text-lg font-medium text-gray-900">
      {getMonthName(currentMonth)}
    </h4>
    
    <button
      on:click={nextMonth}
      disabled={!canGoNext}
      class="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  </div>
  
  <!-- Day Labels -->
  <div class="grid grid-cols-7 gap-1 mb-2">
    {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as dayName}
      <div class="text-center text-sm font-medium text-gray-500 py-2">
        {dayName}
      </div>
    {/each}
  </div>
  
  <!-- Calendar Grid -->
  <div class="grid grid-cols-7 gap-1">
    {#each days as date}
      <button
        type="button"
        on:click={() => handleDateClick(date)}
        disabled={isDateDisabled(date)}
        class="aspect-square flex items-center justify-center text-sm rounded-md transition-colors {
          !date ? 'invisible' :
          isDateDisabled(date) ? 'text-gray-300 cursor-not-allowed' :
          isDateSelected(date) ? 'bg-green-600 text-white' :
          isDateInRange(date) ? 'bg-green-100 text-green-800' :
          isDateUnavailable(date) ? 'bg-red-100 text-red-600 line-through' :
          isDateBooked(date) ? 'bg-yellow-100 text-yellow-800' :
          'text-gray-900 hover:bg-gray-100'
        }"
        title={
          !date ? '' :
          isDateUnavailable(date) ? 'Unavailable' :
          isDateBooked(date) ? 'Already booked' :
          isDateDisabled(date) ? 'Not available' :
          ''
        }
      >
        {date ? date.getDate() : ''}
      </button>
    {/each}
  </div>
  
  <!-- Legend -->
  <div class="mt-4 flex flex-wrap gap-4 text-xs">
    <div class="flex items-center">
      <div class="w-3 h-3 bg-green-600 rounded mr-2"></div>
      <span class="text-gray-600">Selected</span>
    </div>
    <div class="flex items-center">
      <div class="w-3 h-3 bg-green-100 rounded mr-2"></div>
      <span class="text-gray-600">In Range</span>
    </div>
    <div class="flex items-center">
      <div class="w-3 h-3 bg-yellow-100 rounded mr-2"></div>
      <span class="text-gray-600">Booked</span>
    </div>
    <div class="flex items-center">
      <div class="w-3 h-3 bg-red-100 rounded mr-2"></div>
      <span class="text-gray-600">Unavailable</span>
    </div>
  </div>
  
  <!-- Selected Range Display -->
  {#if selectedStartDate && selectedEndDate}
    <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
      <p class="text-sm text-green-800">
        <strong>Selected:</strong> 
        {selectedStartDate.toLocaleDateString()} - {selectedEndDate.toLocaleDateString()}
        ({Math.ceil((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24))} day{Math.ceil((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''})
      </p>
    </div>
  {:else if selectedStartDate}
    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <p class="text-sm text-blue-800">
        <strong>Start Date:</strong> {selectedStartDate.toLocaleDateString()}
        <br>
        <em>Click another date to select your end date</em>
      </p>
    </div>
  {/if}
</div>
