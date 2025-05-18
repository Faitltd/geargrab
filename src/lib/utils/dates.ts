import { format, formatDistance, differenceInDays, addDays, isAfter, isBefore, isEqual } from 'date-fns';

// Format a date to a readable string
export function formatDate(date: Date | number, formatString: string = 'MMM d, yyyy'): string {
  return format(date, formatString);
}

// Format a date range
export function formatDateRange(startDate: Date, endDate: Date): string {
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    // Same month and year
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
  } else if (startDate.getFullYear() === endDate.getFullYear()) {
    // Same year, different month
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  } else {
    // Different years
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  }
}

// Calculate the number of days between two dates
export function getDaysBetween(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate) + 1; // Include both start and end days
}

// Format a relative time (e.g., "2 days ago")
export function formatRelativeTime(date: Date | number): string {
  return formatDistance(date, new Date(), { addSuffix: true });
}

// Check if a date range overlaps with another date range
export function dateRangesOverlap(
  range1Start: Date,
  range1End: Date,
  range2Start: Date,
  range2End: Date
): boolean {
  return (
    (isAfter(range1Start, range2Start) || isEqual(range1Start, range2Start)) && 
    (isBefore(range1Start, range2End) || isEqual(range1Start, range2End))
  ) || (
    (isAfter(range1End, range2Start) || isEqual(range1End, range2Start)) && 
    (isBefore(range1End, range2End) || isEqual(range1End, range2End))
  ) || (
    (isBefore(range1Start, range2Start) || isEqual(range1Start, range2Start)) && 
    (isAfter(range1End, range2End) || isEqual(range1End, range2End))
  );
}

// Generate an array of dates between start and end dates
export function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

// Convert a Firestore timestamp to a JavaScript Date
export function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  
  // Handle Firestore Timestamp objects
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Handle timestamp numbers
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // Handle date strings
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  // Default fallback
  return new Date();
}
