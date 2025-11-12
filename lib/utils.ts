/**
 * Utility functions for common operations
 */

import { CURRENCY_SYMBOL } from "@/types";

/**
 * Format price with currency symbol
 * @param price - Price as number or string
 * @param currency - Currency symbol (default: S$)
 * @returns Formatted price string
 */
export function formatPrice(price: number | string | null | undefined, currency: string = CURRENCY_SYMBOL): string {
  if (price === null || price === undefined) return `${currency} 0.00`;
  
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) return `${currency} 0.00`;
  
  return `${currency} ${numPrice.toFixed(2)}`;
}

/**
 * Format currency amount without symbol
 * @param amount - Amount as number or string
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted amount string
 */
export function formatAmount(amount: number | string | null | undefined, decimals: number = 2): string {
  if (amount === null || amount === undefined) return "0.00";
  
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return "0.00";
  
  return numAmount.toFixed(decimals);
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate string to specified length
 * @param str - String to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to append (default: "...")
 * @returns Truncated string
 */
export function truncate(str: string, length: number, suffix: string = "..."): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safe JSON parse
 * @param json - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

