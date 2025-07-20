<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GlassCard from './GlassCard.svelte';
  import ModernButton from './ModernButton.svelte';
  
  export let startDate: string = '';
  export let endDate: string = '';
  export let minDate: string = new Date().toISOString().split('T')[0];
  export let maxDate: string = '';
  export let blockedDates: string[] = [];
  export let pricePerDay: number = 0;
  export let isOpen: boolean = false;
  
  const dispatch = createEventDispatcher<{
    dateChange: { startDate: string; endDate: string; days: number; totalPrice: number };
    close: void;
  }>();
  
  let currentMonth = new Date();
  let selectingStart = true;
  let hoveredDate: string = '';
  
  $: days = startDate && endDate ? calculateDays(startDate, endDate) : 0;
  $: totalPrice = days * pricePerDay;
  
  const calculateDays = (start: string, end: string): number => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
  };
  
  const isDateBlocked = (date: string): boolean => {
    return blockedDates.includes(date) || new Date(date) < new Date(minDate);
  };
  
  const isDateInRange = (date: string): boolean => {
    if (!startDate || !endDate) return false;
    const dateTime = new Date(date).getTime();
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    return dateTime >= startTime && dateTime <= endTime;
  };
  
  const isDateHovered = (date: string): boolean => {
    if (!startDate || !hoveredDate || selectingStart) return false;
    const dateTime = new Date(date).getTime();
    const startTime = new Date(startDate).getTime();
    const hoveredTime = new Date(hoveredDate).getTime();
    return dateTime >= startTime && dateTime <= hoveredTime;
  };
  
  const handleDateClick = (date: string) => {
    if (isDateBlocked(date)) return;
    
    if (selectingStart || !startDate) {
      startDate = date;
      endDate = '';
      selectingStart = false;
    } else {
      if (new Date(date) < new Date(startDate)) {
        startDate = date;
        endDate = '';
      } else {
        endDate = date;
        selectingStart = true;
        dispatch('dateChange', { 
          startDate, 
          endDate, 
          days: calculateDays(startDate, date),
          totalPrice: calculateDays(startDate, date) * pricePerDay
        });
      }
    }
  };
  
  const handleDateHover = (date: string) => {
    if (!isDateBlocked(date)) {
      hoveredDate = date;
    }
  };
  
  const prevMonth = () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
  };
  
  const nextMonth = () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  };
  
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Date[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  $: monthDays = getDaysInMonth(currentMonth);
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <GlassCard variant="default" size="lg" class="w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-neutral-900">Select Dates</h3>
        <button
          on:click={() => dispatch('close')}
          class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <svg class="h-5 w-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Selected Dates Display -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="text-center">
          <label class="block text-sm font-medium text-neutral-700 mb-1">Check-in</label>
          <div class="bg-neutral-50 rounded-lg p-3 text-sm">
            {startDate ? formatDisplayDate(startDate) : 'Select date'}
          </div>
        </div>
        <div class="text-center">
          <label class="block text-sm font-medium text-neutral-700 mb-1">Check-out</label>
          <div class="bg-neutral-50 rounded-lg p-3 text-sm">
            {endDate ? formatDisplayDate(endDate) : 'Select date'}
          </div>
        </div>
      </div>
      
      <!-- Calendar -->
      <div class="mb-6">
        <!-- Month Navigation -->
        <div class="flex items-center justify-between mb-4">
          <button
            on:click={prevMonth}
            class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg class="h-5 w-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h4 class="text-lg font-semibold text-neutral-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          
          <button
            on:click={nextMonth}
            class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg class="h-5 w-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <!-- Day Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          {#each dayNames as dayName}
            <div class="text-center text-sm font-medium text-neutral-500 py-2">
              {dayName}
            </div>
          {/each}
        </div>
        
        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
          {#each monthDays as day}
            {@const dateString = formatDate(day)}
            {@const isCurrentMonth = day.getMonth() === currentMonth.getMonth()}
            {@const isBlocked = isDateBlocked(dateString)}
            {@const isSelected = dateString === startDate || dateString === endDate}
            {@const isInRange = isDateInRange(dateString)}
            {@const isHovered = isDateHovered(dateString)}
            
            <button
              class="aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-200"
              class:text-neutral-300={!isCurrentMonth}
              class:text-neutral-900={isCurrentMonth && !isBlocked && !isSelected}
              class:text-neutral-400={isBlocked}
              class:bg-primary-500={isSelected}
              class:text-white={isSelected}
              class:bg-primary-100={isInRange || isHovered}
              class:hover:bg-neutral-100={!isBlocked && !isSelected && !isInRange}
              class:cursor-not-allowed={isBlocked}
              class:cursor-pointer={!isBlocked}
              disabled={isBlocked}
              on:click={() => handleDateClick(dateString)}
              on:mouseenter={() => handleDateHover(dateString)}
            >
              {day.getDate()}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Price Summary -->
      {#if startDate && endDate && days > 0}
        <div class="bg-neutral-50 rounded-lg p-4 mb-6">
          <div class="flex justify-between items-center text-sm mb-2">
            <span>${pricePerDay}/day × {days} days</span>
            <span>${(pricePerDay * days).toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-center font-semibold">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      {/if}
      
      <!-- Actions -->
      <div class="flex gap-3">
        <ModernButton 
          variant="ghost" 
          fullWidth={true}
          on:click={() => dispatch('close')}
        >
          Cancel
        </ModernButton>
        
        <ModernButton 
          variant="primary" 
          fullWidth={true}
          disabled={!startDate || !endDate}
          on:click={() => {
            dispatch('dateChange', { startDate, endDate, days, totalPrice });
            dispatch('close');
          }}
        >
          Confirm Dates
        </ModernButton>
      </div>
    </GlassCard>
  </div>
{/if}
