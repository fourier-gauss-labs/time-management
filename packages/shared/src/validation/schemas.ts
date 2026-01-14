/**
 * Zod validation schemas for domain entities
 */

import { z } from 'zod';

/**
 * ISO 8601 date string schema
 */
export const ISO8601DateSchema = z.string().datetime();

/**
 * Action state schema
 */
export const ActionStateSchema = z.enum([
  'planned',
  'in-progress',
  'completed',
  'deferred',
  'rolled-over',
]);

/**
 * Recurrence frequency schema
 */
export const RecurrenceFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);

/**
 * Day of week schema (0-6, where 0 = Sunday)
 */
export const DayOfWeekSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

/**
 * Recurrence pattern schema
 */
export const RecurrencePatternSchema = z.object({
  frequency: RecurrenceFrequencySchema,
  interval: z.union([z.number(), z.array(DayOfWeekSchema)]).optional(),
  endDate: ISO8601DateSchema.optional(),
});

/**
 * Driver schema
 */
export const DriverSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  isActive: z.boolean().default(true),
  createdAt: ISO8601DateSchema,
  updatedAt: ISO8601DateSchema,
});

/**
 * Milestone schema
 */
export const MilestoneSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  driverId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  targetDate: ISO8601DateSchema.optional(),
  createdAt: ISO8601DateSchema,
  updatedAt: ISO8601DateSchema,
});

/**
 * Action schema
 */
export const ActionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  milestoneId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  state: ActionStateSchema.default('planned'),
  recurrencePattern: RecurrencePatternSchema.optional(),
  estimatedMinutes: z.number().int().positive().max(1440).optional(),
  trigger: z.string().max(500, 'Trigger must be 500 characters or less').optional(),
  createdAt: ISO8601DateSchema,
  updatedAt: ISO8601DateSchema,
});

/**
 * Daily snapshot schema
 */
export const DailySnapshotSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  actions: z.array(ActionSchema),
  createdAt: ISO8601DateSchema,
});

/**
 * Create driver input schema
 */
export const CreateDriverInputSchema = z.object({
  userId: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  isActive: z.boolean().default(true),
});

/**
 * Create milestone input schema
 */
export const CreateMilestoneInputSchema = z.object({
  userId: z.string(),
  driverId: z.string().uuid('Milestones must be linked to a driver'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  targetDate: ISO8601DateSchema.optional(),
});

/**
 * Create action input schema
 */
export const CreateActionInputSchema = z.object({
  userId: z.string(),
  milestoneId: z.string().uuid('Actions must be linked to a milestone'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  state: ActionStateSchema.default('planned'),
  recurrencePattern: RecurrencePatternSchema.optional(),
  estimatedMinutes: z.number().int().positive().max(1440).optional(),
  trigger: z.string().max(500, 'Trigger must be 500 characters or less').optional(),
});
