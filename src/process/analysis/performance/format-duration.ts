/**
 * Duration Formatting Utilities
 * Format duration in human-readable format
 */

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (days >= 1) return `${days.toFixed(2)} days`;
  if (hours >= 1) return `${hours.toFixed(2)} hours`;
  if (minutes >= 1) return `${minutes.toFixed(2)} minutes`;
  return `${seconds.toFixed(2)} seconds`;
}
