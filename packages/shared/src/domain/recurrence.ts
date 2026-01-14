/**
 * Recurrence pattern logic for habitual actions
 */

import { RecurrencePattern, DayOfWeek } from '../types/domain';

/**
 * Calculates the next occurrence date based on a recurrence pattern
 *
 * @param pattern - The recurrence pattern
 * @param fromDate - The date to calculate from (defaults to today)
 * @returns The next occurrence date, or null if the recurrence has ended
 */
export function getNextOccurrence(
  pattern: RecurrencePattern,
  fromDate: Date = new Date()
): Date | null {
  // Check if recurrence has ended
  if (pattern.endDate) {
    const endDate = new Date(pattern.endDate);
    if (fromDate >= endDate) {
      return null;
    }
  }

  const nextDate = new Date(fromDate);

  switch (pattern.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      if (Array.isArray(pattern.interval)) {
        // Find the next day of week in the pattern
        const currentDayOfWeek = nextDate.getDay();
        const targetDays = pattern.interval as DayOfWeek[];

        // Find the next day in the week
        let daysToAdd = 1;
        let found = false;

        for (let i = 1; i <= 7; i++) {
          const checkDay = (currentDayOfWeek + i) % 7;
          if (targetDays.includes(checkDay as DayOfWeek)) {
            daysToAdd = i;
            found = true;
            break;
          }
        }

        if (!found) {
          // No matching day found in next 7 days, should not happen with valid data
          return null;
        }

        nextDate.setDate(nextDate.getDate() + daysToAdd);
      } else {
        // Default weekly: same day next week
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;

    case 'monthly':
      if (typeof pattern.interval === 'number') {
        // Specific day of month
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(pattern.interval);
      } else {
        // Default monthly: same date next month
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
  }

  // Check again if next occurrence exceeds end date
  if (pattern.endDate) {
    const endDate = new Date(pattern.endDate);
    if (nextDate > endDate) {
      return null;
    }
  }

  return nextDate;
}

/**
 * Checks if a recurrence pattern should generate a new instance on a given date
 *
 * @param pattern - The recurrence pattern
 * @param checkDate - The date to check
 * @param lastOccurrence - The date of the last occurrence
 * @returns true if a new instance should be created
 */
export function shouldCreateInstance(
  pattern: RecurrencePattern,
  checkDate: Date,
  lastOccurrence: Date
): boolean {
  // Check if recurrence has ended
  if (pattern.endDate) {
    const endDate = new Date(pattern.endDate);
    if (checkDate > endDate) {
      return false;
    }
  }

  switch (pattern.frequency) {
    case 'daily':
      // Create if it's a different day
      return !isSameDay(checkDate, lastOccurrence);

    case 'weekly':
      if (Array.isArray(pattern.interval)) {
        const checkDayOfWeek = checkDate.getDay() as DayOfWeek;
        return pattern.interval.includes(checkDayOfWeek) && !isSameDay(checkDate, lastOccurrence);
      } else {
        // Same day of week as last occurrence
        return (
          checkDate.getDay() === lastOccurrence.getDay() && !isSameDay(checkDate, lastOccurrence)
        );
      }

    case 'monthly':
      if (typeof pattern.interval === 'number') {
        return checkDate.getDate() === pattern.interval && !isSameDay(checkDate, lastOccurrence);
      } else {
        // Same date of month as last occurrence
        return (
          checkDate.getDate() === lastOccurrence.getDate() && !isSameDay(checkDate, lastOccurrence)
        );
      }
  }
}

/**
 * Validates a recurrence pattern
 *
 * @param pattern - The recurrence pattern to validate
 * @throws {Error} If the pattern is invalid
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): void {
  if (pattern.frequency === 'weekly' && Array.isArray(pattern.interval)) {
    if (pattern.interval.length === 0) {
      throw new Error('Weekly recurrence must specify at least one day of week');
    }
  }

  if (pattern.frequency === 'monthly' && typeof pattern.interval === 'number') {
    if (pattern.interval < 1 || pattern.interval > 31) {
      throw new Error('Monthly recurrence day must be between 1 and 31');
    }
  }

  if (pattern.endDate) {
    const endDate = new Date(pattern.endDate);
    const now = new Date();
    if (endDate < now) {
      throw new Error('Recurrence end date cannot be in the past');
    }
  }
}

/**
 * Helper function to check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
