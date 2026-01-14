/**
 * Tests for recurrence pattern logic
 */

import { describe, it, expect } from 'vitest';
import {
  getNextOccurrence,
  shouldCreateInstance,
  validateRecurrencePattern,
} from '../domain/recurrence';
import {
  createDailyRecurrence,
  createWeeklyRecurrence,
  createMonthlyRecurrence,
} from '../test/fixtures';

describe('getNextOccurrence', () => {
  describe('daily recurrence', () => {
    it('should return next day for daily recurrence', () => {
      const pattern = createDailyRecurrence();
      const fromDate = new Date('2026-01-13T10:00:00.000Z');
      const next = getNextOccurrence(pattern, fromDate);

      expect(next).not.toBeNull();
      expect(next?.getDate()).toBe(14);
    });

    it('should return null if past end date', () => {
      const pattern = createDailyRecurrence('2026-01-13T00:00:00.000Z');
      const fromDate = new Date('2026-01-14T10:00:00.000Z');
      const next = getNextOccurrence(pattern, fromDate);

      expect(next).toBeNull();
    });
  });

  describe('weekly recurrence', () => {
    it('should return next occurrence for weekly pattern with specific days', () => {
      // Monday, Wednesday, Friday (1, 3, 5)
      const pattern = createWeeklyRecurrence([1, 3, 5]);
      const fromDate = new Date('2026-01-12T10:00:00.000Z'); // Monday
      const next = getNextOccurrence(pattern, fromDate);

      expect(next).not.toBeNull();
      // Should be Wednesday
      expect(next?.getDay()).toBe(3);
    });

    it('should wrap to next week if no more days in current week', () => {
      const pattern = createWeeklyRecurrence([1]); // Monday only
      const fromDate = new Date('2026-01-13T10:00:00.000Z'); // Tuesday
      const next = getNextOccurrence(pattern, fromDate);

      expect(next).not.toBeNull();
      // Should be next Monday
      expect(next?.getDay()).toBe(1);
      expect(next!.getDate()).toBe(19);
    });

    it('should default to same day next week without interval', () => {
      const pattern = { frequency: 'weekly' as const };
      const fromDate = new Date('2026-01-13T10:00:00.000Z'); // Tuesday
      const next = getNextOccurrence(pattern, fromDate);

      expect(next).not.toBeNull();
      expect(next?.getDate()).toBe(20); // Next Tuesday
    });
  });

  describe('monthly recurrence', () => {
    it('should return next month on specific day', () => {
      const pattern = createMonthlyRecurrence(15);
      const fromDate = new Date('2026-01-13T10:00:00.000Z');
      const next = getNextOccurrence(pattern, fromDate);

      expect(next).not.toBeNull();
      expect(next?.getMonth()).toBe(1); // February
      expect(next?.getDate()).toBe(15);
    });

    it('should default to same date next month without interval', () => {
      const pattern = { frequency: 'monthly' as const };
      const fromDate = new Date('2026-01-13T10:00:00.000Z');
      const next = getNextOccurrence(pattern, fromDate);

      expect(next).not.toBeNull();
      expect(next?.getMonth()).toBe(1); // February
      expect(next?.getDate()).toBe(13);
    });
  });

  describe('end date handling', () => {
    it('should respect end date for all frequencies', () => {
      const endDate = '2026-01-15T00:00:00.000Z';
      const fromDate = new Date('2026-01-16T10:00:00.000Z');

      const dailyPattern = createDailyRecurrence(endDate);
      expect(getNextOccurrence(dailyPattern, fromDate)).toBeNull();

      const weeklyPattern = createWeeklyRecurrence([1, 2, 3, 4, 5], endDate);
      expect(getNextOccurrence(weeklyPattern, fromDate)).toBeNull();

      const monthlyPattern = createMonthlyRecurrence(15, endDate);
      expect(getNextOccurrence(monthlyPattern, fromDate)).toBeNull();
    });

    it('should return null if next occurrence would exceed end date', () => {
      const pattern = createDailyRecurrence('2026-01-14T00:00:00.000Z');
      const fromDate = new Date('2026-01-13T23:00:00.000Z');
      const next = getNextOccurrence(pattern, fromDate);

      // Next occurrence would be Jan 14, which is the end date
      expect(next).toBeNull();
    });
  });
});

describe('shouldCreateInstance', () => {
  it('should return true for daily recurrence on different day', () => {
    const pattern = createDailyRecurrence();
    const checkDate = new Date('2026-01-14T10:00:00.000Z');
    const lastOccurrence = new Date('2026-01-13T10:00:00.000Z');

    expect(shouldCreateInstance(pattern, checkDate, lastOccurrence)).toBe(true);
  });

  it('should return false for daily recurrence on same day', () => {
    const pattern = createDailyRecurrence();
    const checkDate = new Date('2026-01-13T15:00:00.000Z');
    const lastOccurrence = new Date('2026-01-13T10:00:00.000Z');

    expect(shouldCreateInstance(pattern, checkDate, lastOccurrence)).toBe(false);
  });

  it('should return true for weekly recurrence on matching day', () => {
    const pattern = createWeeklyRecurrence([1, 3, 5]); // Mon, Wed, Fri
    const checkDate = new Date('2026-01-14T10:00:00.000Z'); // Wednesday
    const lastOccurrence = new Date('2026-01-12T10:00:00.000Z'); // Monday

    expect(shouldCreateInstance(pattern, checkDate, lastOccurrence)).toBe(true);
  });

  it('should return false for weekly recurrence on non-matching day', () => {
    const pattern = createWeeklyRecurrence([1, 3, 5]); // Mon, Wed, Fri
    const checkDate = new Date('2026-01-13T10:00:00.000Z'); // Tuesday
    const lastOccurrence = new Date('2026-01-12T10:00:00.000Z'); // Monday

    expect(shouldCreateInstance(pattern, checkDate, lastOccurrence)).toBe(false);
  });

  it('should return true for monthly recurrence on matching day', () => {
    const pattern = createMonthlyRecurrence(15);
    const checkDate = new Date('2026-02-15T10:00:00.000Z');
    const lastOccurrence = new Date('2026-01-15T10:00:00.000Z');

    expect(shouldCreateInstance(pattern, checkDate, lastOccurrence)).toBe(true);
  });

  it('should return false if past end date', () => {
    const pattern = createDailyRecurrence('2026-01-15T00:00:00.000Z');
    const checkDate = new Date('2026-01-16T10:00:00.000Z');
    const lastOccurrence = new Date('2026-01-15T10:00:00.000Z');

    expect(shouldCreateInstance(pattern, checkDate, lastOccurrence)).toBe(false);
  });
});

describe('validateRecurrencePattern', () => {
  it('should accept valid daily pattern', () => {
    const pattern = createDailyRecurrence();
    expect(() => validateRecurrencePattern(pattern)).not.toThrow();
  });

  it('should accept valid weekly pattern with days', () => {
    const pattern = createWeeklyRecurrence([1, 3, 5]);
    expect(() => validateRecurrencePattern(pattern)).not.toThrow();
  });

  it('should reject weekly pattern with empty days array', () => {
    const pattern = createWeeklyRecurrence([]);
    expect(() => validateRecurrencePattern(pattern)).toThrow(
      'Weekly recurrence must specify at least one day of week'
    );
  });

  it('should accept valid monthly pattern', () => {
    const pattern = createMonthlyRecurrence(15);
    expect(() => validateRecurrencePattern(pattern)).not.toThrow();
  });

  it('should reject monthly pattern with invalid day', () => {
    const pattern = createMonthlyRecurrence(32);
    expect(() => validateRecurrencePattern(pattern)).toThrow(
      'Monthly recurrence day must be between 1 and 31'
    );
  });

  it('should reject monthly pattern with day < 1', () => {
    const pattern = createMonthlyRecurrence(0);
    expect(() => validateRecurrencePattern(pattern)).toThrow(
      'Monthly recurrence day must be between 1 and 31'
    );
  });

  it('should reject pattern with end date in the past', () => {
    const pattern = createDailyRecurrence('2020-01-01T00:00:00.000Z');
    expect(() => validateRecurrencePattern(pattern)).toThrow(
      'Recurrence end date cannot be in the past'
    );
  });

  it('should accept pattern with future end date', () => {
    const pattern = createDailyRecurrence('2027-12-31T00:00:00.000Z');
    expect(() => validateRecurrencePattern(pattern)).not.toThrow();
  });
});
