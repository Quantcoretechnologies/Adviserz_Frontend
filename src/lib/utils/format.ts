/** "9876543210" -> "+91 98765-43210" */
export function formatIndianPhone(digits: string): string {
  return `+91 ${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** "75000.00" -> "₹75,000"; "200000.50" -> "₹2,00,000.50" (Indian digit grouping). */
export function formatInr(amount: string): string {
  const value = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** "2.5000" -> "2.5"; "1.0000" -> "1" */
export function trimDecimal(value: string): string {
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}

/** 90 -> "01:30" */
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
