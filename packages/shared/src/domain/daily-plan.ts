/**
 * Domain Types for Daily Plan Repository
 *
 * Represents a day's to-do list and time blocks.
 * Simplified model: one version per day (no midday snapshots).
 */

import type { UserId, ActionId } from '../types/domain';

/**
 * To-Do List Item
 */

export type ActionClassification = 'urgent' | 'important' | 'other';

export interface TodoItem {
  PK: string;
  SK: string;
  actionId: ActionId;
  order: number;
  classification: ActionClassification;
  estimatedPomodoros?: number;
  notes?: string;
  completedAt?: string;
}

/**
 * Time Block
 */

export type BlockType = 'MEETING' | 'POMODORO' | 'BREAK' | 'BUFFER';

export interface TimeBlock {
  PK: string;
  SK: string;
  blockId: string;
  blockType: BlockType;
  startTimeIso: string;
  endTimeIso: string;
  // For POMODORO blocks
  actionId?: ActionId;
  pomodoroIndex?: number;
}

/**
 * Daily Plan Metadata
 */

export interface DailyPlanHead {
  PK: string;
  SK: string;
  date: string;
  userId: UserId;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request/Response Types
 */

export interface CreateTodoInput {
  actionId: ActionId;
  classification: ActionClassification;
  estimatedPomodoros?: number;
  notes?: string;
}

export interface UpdateTodoInput {
  classification?: ActionClassification;
  estimatedPomodoros?: number;
  notes?: string;
  completedAt?: string;
}

export interface CreateBlockInput {
  blockType: BlockType;
  startTimeIso: string;
  endTimeIso: string;
  actionId?: ActionId;
  pomodoroIndex?: number;
}

export interface DailyPlan {
  date: string;
  todos: TodoItem[];
  blocks: TimeBlock[];
}
