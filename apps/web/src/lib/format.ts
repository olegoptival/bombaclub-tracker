/**
 * Format a money value: 1234.5 → "1,234.50". No currency symbol —
 * we work in chips, not dollars.
 */
export function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
