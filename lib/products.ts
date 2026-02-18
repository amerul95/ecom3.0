/**
 * Format a price value for form input (empty string for null/undefined, otherwise string representation).
 */
export function formatPriceValue(
  price: string | number | { toString: () => string } | null | undefined
): string {
  if (price === null || price === undefined) return '';
  if (typeof price === 'number') return price.toFixed(2);
  if (typeof price === 'string') return price;
  return price.toString();
}
