import { format, differenceInDays } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

/**
 * Formats a date to a readable string format
 * @param date - The date to format
 * @param formatString - The format string to use (default: 'MMM d, yyyy')
 * @returns A formatted date string
 */
export function formatDate(date: Date, formatString: string = 'MMM d, yyyy'): string {
  return format(date, formatString);
}

/**
 * Converts a Firebase Timestamp to a JavaScript Date object
 * @param timestamp - The Firebase timestamp to convert
 * @returns A JavaScript Date object
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Calculates the number of days between two dates
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The number of days between the dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate) + 1; // Include the end day
}

/**
 * Checks if a date is in the past
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Converts a JavaScript Date to a date string in YYYY-MM-DD format
 * @param date - The date to convert
 * @returns Date string in YYYY-MM-DD format
 */
export function dateToString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses a date string in YYYY-MM-DD format to a JavaScript Date
 * @param dateString - The date string to parse
 * @returns A JavaScript Date object
 */
export function stringToDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}