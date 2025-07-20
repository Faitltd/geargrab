// Formatting utilities for consistent data display

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting failed:', error);
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Format numbers with locale-specific formatting
 */
export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch (error) {
    console.warn('Number formatting failed:', error);
    return value.toString();
  }
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  } catch (error) {
    console.warn('Percentage formatting failed:', error);
    return `${value.toFixed(decimals)}%`;
  }
}

/**
 * Format file sizes
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format phone numbers
 */
export function formatPhoneNumber(phone: string, format: 'US' | 'international' = 'US'): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  if (format === 'US' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (format === 'US' && cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original if can't format
  return phone;
}

/**
 * Format addresses
 */
export function formatAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}, format: 'short' | 'full' = 'full'): string {
  const parts: string[] = [];

  if (format === 'short') {
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
  }

  if (address.street) parts.push(address.street);
  
  const cityStateZip: string[] = [];
  if (address.city) cityStateZip.push(address.city);
  if (address.state) cityStateZip.push(address.state);
  if (address.zipCode) cityStateZip.push(address.zipCode);
  
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }
  
  if (address.country && address.country !== 'US') {
    parts.push(address.country);
  }

  return parts.join(', ');
}

/**
 * Format names
 */
export function formatName(
  firstName?: string,
  lastName?: string,
  format: 'first' | 'last' | 'full' | 'initials' = 'full'
): string {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  switch (format) {
    case 'first':
      return first;
    case 'last':
      return last;
    case 'full':
      return [first, last].filter(Boolean).join(' ');
    case 'initials':
      return [first[0], last[0]].filter(Boolean).join('').toUpperCase();
    default:
      return [first, last].filter(Boolean).join(' ');
  }
}

/**
 * Format text for display (truncate, capitalize, etc.)
 */
export function formatText(
  text: string,
  options: {
    maxLength?: number;
    capitalize?: 'first' | 'words' | 'all' | 'none';
    ellipsis?: string;
  } = {}
): string {
  const {
    maxLength,
    capitalize = 'none',
    ellipsis = '...'
  } = options;

  let formatted = text;

  // Apply capitalization
  switch (capitalize) {
    case 'first':
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
      break;
    case 'words':
      formatted = formatted.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
      break;
    case 'all':
      formatted = formatted.toUpperCase();
      break;
    case 'none':
    default:
      // No change
      break;
  }

  // Apply truncation
  if (maxLength && formatted.length > maxLength) {
    formatted = formatted.slice(0, maxLength - ellipsis.length) + ellipsis;
  }

  return formatted;
}

/**
 * Format lists with proper conjunctions
 */
export function formatList(
  items: string[],
  conjunction: 'and' | 'or' = 'and',
  locale: string = 'en-US'
): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  try {
    return new Intl.ListFormat(locale, {
      style: 'long',
      type: conjunction === 'and' ? 'conjunction' : 'disjunction'
    }).format(items);
  } catch (error) {
    console.warn('List formatting failed:', error);
    const lastItem = items.pop();
    return `${items.join(', ')}, ${conjunction} ${lastItem}`;
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(
  milliseconds: number,
  format: 'short' | 'long' = 'short'
): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (format === 'short') {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
  if (seconds % 60 > 0 && parts.length === 0) {
    parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);
  }

  return formatList(parts);
}
