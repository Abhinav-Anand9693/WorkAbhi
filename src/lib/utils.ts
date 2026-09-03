export function cn(
  ...classes: Array<
    string | false | null | undefined
  >
) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(
  value: number,
  maximumFractionDigits = 2
) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits
  });
}

export function formatCurrency(
  value: number
) {
  return `₹${formatNumber(value)}`;
}