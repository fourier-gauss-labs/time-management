/**
 * Tests for validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  DriverSchema,
  MilestoneSchema,
  ActionSchema,
  DailySnapshotSchema,
  CreateDriverInputSchema,
  CreateMilestoneInputSchema,
  CreateActionInputSchema,
  RecurrencePatternSchema,
} from '../validation/schemas';
import {
  createTestDriver,
  createTestMilestone,
  createTestAction,
  createTestDailySnapshot,
  createTestDriverInput,
  createTestMilestoneInput,
  createTestActionInput,
} from '../test/fixtures';

describe('DriverSchema', () => {
  it('should validate a valid driver', () => {
    const driver = createTestDriver();
    const result = DriverSchema.safeParse(driver);
    expect(result.success).toBe(true);
  });

  it('should reject a driver with missing title', () => {
    const driver = createTestDriver({ title: '' });
    const result = DriverSchema.safeParse(driver);
    expect(result.success).toBe(false);
  });

  it('should reject a driver with title too long', () => {
    const driver = createTestDriver({ title: 'a'.repeat(201) });
    const result = DriverSchema.safeParse(driver);
    expect(result.success).toBe(false);
  });

  it('should reject a driver with invalid UUID', () => {
    const driver = createTestDriver({ id: 'not-a-uuid' });
    const result = DriverSchema.safeParse(driver);
    expect(result.success).toBe(false);
  });

  it('should default isActive to true', () => {
    const driver = createTestDriver();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (driver as any).isActive;
    const result = DriverSchema.parse(driver);
    expect(result.isActive).toBe(true);
  });
});

describe('MilestoneSchema', () => {
  it('should validate a valid milestone', () => {
    const milestone = createTestMilestone();
    const result = MilestoneSchema.safeParse(milestone);
    expect(result.success).toBe(true);
  });

  it('should reject a milestone with missing title', () => {
    const milestone = createTestMilestone({ title: '' });
    const result = MilestoneSchema.safeParse(milestone);
    expect(result.success).toBe(false);
  });

  it('should reject a milestone with invalid driverId UUID', () => {
    const milestone = createTestMilestone({ driverId: 'not-a-uuid' });
    const result = MilestoneSchema.safeParse(milestone);
    expect(result.success).toBe(false);
  });

  it('should accept milestone with optional targetDate', () => {
    const milestone = createTestMilestone({ targetDate: '2026-12-31T00:00:00.000Z' });
    const result = MilestoneSchema.safeParse(milestone);
    expect(result.success).toBe(true);
  });
});

describe('ActionSchema', () => {
  it('should validate a valid action', () => {
    const action = createTestAction();
    const result = ActionSchema.safeParse(action);
    expect(result.success).toBe(true);
  });

  it('should reject an action with missing title', () => {
    const action = createTestAction({ title: '' });
    const result = ActionSchema.safeParse(action);
    expect(result.success).toBe(false);
  });

  it('should reject an action with invalid milestoneId UUID', () => {
    const action = createTestAction({ milestoneId: 'not-a-uuid' });
    const result = ActionSchema.safeParse(action);
    expect(result.success).toBe(false);
  });

  it('should default state to planned', () => {
    const action = createTestAction();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (action as any).state;
    const result = ActionSchema.parse(action);
    expect(result.state).toBe('planned');
  });

  it('should reject action with invalid state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action = createTestAction({ state: 'invalid-state' as any });
    const result = ActionSchema.safeParse(action);
    expect(result.success).toBe(false);
  });

  it('should reject action with negative estimatedMinutes', () => {
    const action = createTestAction({ estimatedMinutes: -10 });
    const result = ActionSchema.safeParse(action);
    expect(result.success).toBe(false);
  });

  it('should reject action with estimatedMinutes > 1440 (24 hours)', () => {
    const action = createTestAction({ estimatedMinutes: 1441 });
    const result = ActionSchema.safeParse(action);
    expect(result.success).toBe(false);
  });
});

describe('DailySnapshotSchema', () => {
  it('should validate a valid daily snapshot', () => {
    const snapshot = createTestDailySnapshot({
      actions: [createTestAction()],
    });
    const result = DailySnapshotSchema.safeParse(snapshot);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.log('Snapshot validation error:', JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('should validate a snapshot with empty actions array', () => {
    const snapshot = createTestDailySnapshot({ actions: [] });
    const result = DailySnapshotSchema.safeParse(snapshot);
    expect(result.success).toBe(true);
  });
});

describe('CreateDriverInputSchema', () => {
  it('should validate valid driver input', () => {
    const input = createTestDriverInput();
    const result = CreateDriverInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject input with empty title', () => {
    const input = createTestDriverInput({ title: '' });
    const result = CreateDriverInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Title is required');
    }
  });
});

describe('CreateMilestoneInputSchema', () => {
  it('should validate valid milestone input', () => {
    const input = createTestMilestoneInput();
    const result = CreateMilestoneInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject input with non-UUID driverId', () => {
    const input = createTestMilestoneInput({ driverId: 'not-a-uuid' });
    const result = CreateMilestoneInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Milestones must be linked to a driver');
    }
  });
});

describe('CreateActionInputSchema', () => {
  it('should validate valid action input', () => {
    const input = createTestActionInput();
    const result = CreateActionInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject input with non-UUID milestoneId', () => {
    const input = createTestActionInput({ milestoneId: 'not-a-uuid' });
    const result = CreateActionInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Actions must be linked to a milestone');
    }
  });
});

describe('RecurrencePatternSchema', () => {
  it('should validate daily recurrence', () => {
    const pattern = { frequency: 'daily' as const };
    const result = RecurrencePatternSchema.safeParse(pattern);
    expect(result.success).toBe(true);
  });

  it('should validate weekly recurrence with days', () => {
    const pattern = { frequency: 'weekly' as const, interval: [1, 3, 5] };
    const result = RecurrencePatternSchema.safeParse(pattern);
    expect(result.success).toBe(true);
  });

  it('should validate monthly recurrence with day of month', () => {
    const pattern = { frequency: 'monthly' as const, interval: 15 };
    const result = RecurrencePatternSchema.safeParse(pattern);
    expect(result.success).toBe(true);
  });

  it('should validate recurrence with end date', () => {
    const pattern = {
      frequency: 'daily' as const,
      endDate: '2026-12-31T00:00:00.000Z',
    };
    const result = RecurrencePatternSchema.safeParse(pattern);
    expect(result.success).toBe(true);
  });

  it('should reject invalid frequency', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pattern = { frequency: 'yearly' as any };
    const result = RecurrencePatternSchema.safeParse(pattern);
    expect(result.success).toBe(false);
  });
});
