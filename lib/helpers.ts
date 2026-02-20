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

/** Format a date string for display (e.g. "Feb 19, 2025"). */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
