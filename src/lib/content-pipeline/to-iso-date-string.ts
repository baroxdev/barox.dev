/** Formats a Date as a plain "YYYY-MM-DD" string (no time-of-day component). */
export function toIsoDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}
