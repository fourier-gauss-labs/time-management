/**
 * Test fixtures and factories for domain entities
 */

import { randomUUID } from 'crypto';
import {
  Driver,
  Milestone,
  Action,
  DailySnapshot,
  CreateDriverInput,
  CreateMilestoneInput,
  CreateActionInput,
  ActionState,
  RecurrencePattern,
  DayOfWeek,
  UserId,
  DriverId,
  MilestoneId,
} from '../types/domain';

/**
 * Creates a test driver with default values
 */
export function createTestDriver(overrides?: Partial<Driver>): Driver {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId: 'test-user-id',
    title: 'Test Driver',
    description: 'A test driver for unit tests',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a test milestone with default values
 */
export function createTestMilestone(overrides?: Partial<Milestone>): Milestone {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId: 'test-user-id',
    driverId: randomUUID(),
    title: 'Test Milestone',
    description: 'A test milestone for unit tests',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a test action with default values
 */
export function createTestAction(overrides?: Partial<Action>): Action {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId: 'test-user-id',
    milestoneId: randomUUID(),
    title: 'Test Action',
    description: 'A test action for unit tests',
    state: 'planned',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a test daily snapshot with default values
 */
export function createTestDailySnapshot(overrides?: Partial<DailySnapshot>): DailySnapshot {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId: 'test-user-id',
    date: new Date().toISOString().split('T')[0],
    actions: [],
    createdAt: now,
    ...overrides,
  };
}

/**
 * Creates a test driver input
 */
export function createTestDriverInput(overrides?: Partial<CreateDriverInput>): CreateDriverInput {
  return {
    userId: 'test-user-id',
    title: 'Test Driver Input',
    description: 'A test driver input',
    isActive: true,
    ...overrides,
  };
}

/**
 * Creates a test milestone input
 */
export function createTestMilestoneInput(
  overrides?: Partial<CreateMilestoneInput>
): CreateMilestoneInput {
  return {
    userId: 'test-user-id',
    driverId: randomUUID(),
    title: 'Test Milestone Input',
    description: 'A test milestone input',
    ...overrides,
  };
}

/**
 * Creates a test action input
 */
export function createTestActionInput(overrides?: Partial<CreateActionInput>): CreateActionInput {
  return {
    userId: 'test-user-id',
    milestoneId: randomUUID(),
    title: 'Test Action Input',
    description: 'A test action input',
    state: 'planned',
    ...overrides,
  };
}

/**
 * Creates a daily recurrence pattern
 */
export function createDailyRecurrence(endDate?: string): RecurrencePattern {
  return {
    frequency: 'daily',
    endDate,
  };
}

/**
 * Creates a weekly recurrence pattern
 */
export function createWeeklyRecurrence(days: DayOfWeek[], endDate?: string): RecurrencePattern {
  return {
    frequency: 'weekly',
    interval: days,
    endDate,
  };
}

/**
 * Creates a monthly recurrence pattern
 */
export function createMonthlyRecurrence(dayOfMonth: number, endDate?: string): RecurrencePattern {
  return {
    frequency: 'monthly',
    interval: dayOfMonth,
    endDate,
  };
}

/**
 * Creates a complete hierarchy of driver -> milestone -> action for testing
 */
export function createTestHierarchy(userId: UserId = 'test-user-id'): {
  driver: Driver;
  milestone: Milestone;
  action: Action;
} {
  const driver = createTestDriver({ userId });
  const milestone = createTestMilestone({ userId, driverId: driver.id });
  const action = createTestAction({ userId, milestoneId: milestone.id });

  return { driver, milestone, action };
}

/**
 * Creates multiple test drivers
 */
export function createTestDrivers(count: number, userId: UserId = 'test-user-id'): Driver[] {
  return Array.from({ length: count }, (_, i) =>
    createTestDriver({
      userId,
      title: `Test Driver ${i + 1}`,
    })
  );
}

/**
 * Creates multiple test milestones
 */
export function createTestMilestones(
  count: number,
  driverId: DriverId,
  userId: UserId = 'test-user-id'
): Milestone[] {
  return Array.from({ length: count }, (_, i) =>
    createTestMilestone({
      userId,
      driverId,
      title: `Test Milestone ${i + 1}`,
    })
  );
}

/**
 * Creates multiple test actions
 */
export function createTestActions(
  count: number,
  milestoneId: MilestoneId,
  userId: UserId = 'test-user-id',
  state?: ActionState
): Action[] {
  return Array.from({ length: count }, (_, i) =>
    createTestAction({
      userId,
      milestoneId,
      title: `Test Action ${i + 1}`,
      state,
    })
  );
}
