/**
 * Shared types and utilities for the time-management application
 */

/**
 * Unique identifier for a user in the system
 */
export type UserId = string;

/**
 * Unique identifier for a task in the system
 */
export type TaskId = string;

/**
 * Base interface for entities with timestamps
 */
export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}
