/**
 * Formats a number as currency (USD)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Truncates a string to a specific length and adds ellipsis if needed
 * @param text - The text to truncate
 * @param length - Maximum length (default: 100)
 * @returns Truncated text
 */
export function truncateText(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Formats a number with thousand separators
 * @param num - The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a phone number to (XXX) XXX-XXXX format
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumber;
}