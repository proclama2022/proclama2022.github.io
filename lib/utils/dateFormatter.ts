/**
 * Date formatting utilities for profile display
 */

/**
 * Format a joined date as "Joined MMM YYYY" with localization support
 *
 * @param isoDate - ISO date string (e.g., "2026-03-02T10:00:00Z")
 * @param locale - Locale for month name localization (default: "en")
 * @returns Formatted string like "Joined Mar 2026"
 *
 * @example
 * formatJoinedDate('2026-03-02T10:00:00Z', 'en') // "Joined Mar 2026"
 * formatJoinedDate('2026-03-02T10:00:00Z', 'it') // "Joined mar 2026"
 */
export function formatJoinedDate(isoDate: string, locale: string = 'en'): string {
  try {
    const date = new Date(isoDate);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Joined';
    }

    // Format month name with locale
    const month = date.toLocaleString(locale, { month: 'short' });
    const year = date.getFullYear();

    return `Joined ${month} ${year}`;
  } catch (error) {
    // Return fallback if parsing fails
    return 'Joined';
  }
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 * Not used in current phase but available for future enhancements
 *
 * @param isoDate - ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    return 'Unknown';
  }
}
