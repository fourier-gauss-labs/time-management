/**
 * Domain types for the time-management application
 */

/**
 * Unique identifier for a driver in the system
 */
export type DriverId = string;

/**
 * Unique identifier for a milestone in the system
 */
export type MilestoneId = string;

/**
 * Unique identifier for an action in the system
 */
export type ActionId = string;

/**
 * Unique identifier for a user in the system
 */
export type UserId = string;

/**
 * ISO 8601 date string
 */
export type ISO8601Date = string;

/**
 * Valid states for an action
 */
export type ActionState = 'planned' | 'in-progress' | 'completed' | 'deferred' | 'rolled-over';

/**
 * Recurrence frequency types
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * Day of week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Day of week as string enum for user settings
 */
export type DayOfWeekString =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

/**
 * Recurrence pattern for habitual actions
 */
export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  /**
   * For weekly: which days of week (0-6, where 0 = Sunday)
   * For monthly: which day of month (1-31)
   */
  interval?: number | DayOfWeek[];
  /**
   * Optional end date for the recurrence
   */
  endDate?: ISO8601Date;
}

/**
 * Base interface for entities with timestamps
 */
export interface TimestampedEntity {
  createdAt: ISO8601Date;
  updatedAt: ISO8601Date;
}

/**
 * Driver entity - represents strategic intent and purpose (the "why")
 */
export interface Driver extends TimestampedEntity {
  id: DriverId;
  userId: UserId;
  title: string;
  description?: string;
  isActive: boolean;
  isArchived: boolean;
}

/**
 * Milestone entity - represents temporal targets linked to drivers (the "when")
 */
export interface Milestone extends TimestampedEntity {
  id: MilestoneId;
  userId: UserId;
  driverId: DriverId;
  title: string;
  description?: string;
  targetDate?: ISO8601Date;
}

/**
 * Action entity - represents executable work linked to milestones (the "what")
 */
export interface Action extends TimestampedEntity {
  id: ActionId;
  userId: UserId;
  milestoneId: MilestoneId;
  title: string;
  description?: string;
  state: ActionState;
  recurrencePattern?: RecurrencePattern;
  estimatedMinutes?: number;
  trigger?: string;
}

/**
 * Daily snapshot - immutable historical state of actions for a specific day
 */
export interface DailySnapshot {
  id: string;
  userId: UserId;
  date: ISO8601Date;
  actions: Action[];
  createdAt: ISO8601Date;
}

/**
 * Onboarding status - tracks whether a user has completed initial onboarding
 */
export interface OnboardingStatus extends TimestampedEntity {
  userId: UserId;
  isOnboarded: boolean;
  onboardingVersion: string;
  completedAt?: ISO8601Date;
}

/**
 * Input type for creating a driver
 */
export interface CreateDriverInput {
  userId: UserId;
  title: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Input type for creating a milestone
 */
export interface CreateMilestoneInput {
  userId: UserId;
  driverId: DriverId;
  title: string;
  description?: string;
  targetDate?: ISO8601Date;
}

/**
 * Input type for creating an action
 */
export interface CreateActionInput {
  userId: UserId;
  milestoneId: MilestoneId;
  title: string;
  description?: string;
  state?: ActionState;
  recurrencePattern?: RecurrencePattern;
  estimatedMinutes?: number;
  trigger?: string;
}

/**
 * Result of orphan detection
 */
export interface OrphanDetectionResult {
  orphanedActions: Action[];
  orphanedMilestones: Milestone[];
  orphanedDrivers: Driver[];
}

/**
 * User settings - stores user preferences and configuration
 */
export interface UserSettings extends TimestampedEntity {
  userId: UserId;
  /**
   * Preferred day of the week for weekly review
   */
  reviewDay: DayOfWeekString;
}

/**
 * Review status - tracks weekly review completion
 */
export interface ReviewStatus extends TimestampedEntity {
  userId: UserId;
  /**
   * ISO 8601 timestamp of last completed review
   */
  lastCompletedAt?: ISO8601Date;
}

/**
 * Input type for updating user settings
 */
export interface UpdateUserSettingsInput {
  reviewDay?: DayOfWeekString;
}

/**
 * Input type for updating a driver
 */
export interface UpdateDriverInput {
  title?: string;
  description?: string;
  isActive?: boolean;
  isArchived?: boolean;
}
