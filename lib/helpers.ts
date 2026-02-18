/**
 * Format a price value for display (handles number, string, or object with toString).
 */
export function formatPrice(
  price: number | string | { toString: () => string } | null | undefined
): string {
  if (price == null) return "0.00";
  if (typeof price === "number") return price.toFixed(2);
  if (typeof price === "string") return parseFloat(price).toFixed(2);
  return parseFloat(price.toString()).toFixed(2);
}
