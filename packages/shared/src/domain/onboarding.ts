/**
 * Onboarding logic for initializing new users with default content
 */

import { v4 as uuid } from 'uuid';
import type {
  Driver,
  Milestone,
  Action,
  OnboardingStatus,
  UserId,
  DriverId,
  MilestoneId,
  ActionId,
  RecurrencePattern,
  ActionState,
} from '../types/domain';
import { DriverSchema, MilestoneSchema, ActionSchema } from '../validation/schemas';

/**
 * Configuration structure for default onboarding content
 */
export interface OnboardingConfig {
  version: string;
  drivers: Array<{
    title: string;
    description?: string;
    isActive: boolean;
    milestones: Array<{
      title: string;
      description?: string;
      targetDate?: string;
      actions: Array<{
        title: string;
        description?: string;
        state: ActionState;
        estimatedMinutes?: number;
        trigger?: string;
        recurrencePattern?: RecurrencePattern;
      }>;
    }>;
  }>;
}

/**
 * Result of onboarding initialization
 */
export interface OnboardingResult {
  drivers: Driver[];
  milestones: Milestone[];
  actions: Action[];
  onboardingStatus: OnboardingStatus;
}

/**
 * Creates default entities from onboarding configuration
 *
 * @param userId - The user ID to create entities for
 * @param config - The onboarding configuration
 * @returns The created entities
 */
export function createDefaultEntities(userId: UserId, config: OnboardingConfig): OnboardingResult {
  const now = new Date().toISOString();
  const drivers: Driver[] = [];
  const milestones: Milestone[] = [];
  const actions: Action[] = [];

  // Create drivers, milestones, and actions from config
  for (const driverConfig of config.drivers) {
    const driverId = uuid() as DriverId;

    const driver: Driver = {
      id: driverId,
      userId,
      title: driverConfig.title,
      description: driverConfig.description,
      isActive: driverConfig.isActive,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    // Validate driver
    DriverSchema.parse(driver);
    drivers.push(driver);

    // Create milestones for this driver
    for (const milestoneConfig of driverConfig.milestones) {
      const milestoneId = uuid() as MilestoneId;

      const milestone: Milestone = {
        id: milestoneId,
        userId,
        driverId,
        title: milestoneConfig.title,
        description: milestoneConfig.description,
        targetDate: milestoneConfig.targetDate,
        createdAt: now,
        updatedAt: now,
      };

      // Validate milestone
      MilestoneSchema.parse(milestone);
      milestones.push(milestone);

      // Create actions for this milestone
      for (const actionConfig of milestoneConfig.actions) {
        const actionId = uuid() as ActionId;

        const action: Action = {
          id: actionId,
          userId,
          milestoneId,
          title: actionConfig.title,
          description: actionConfig.description,
          state: actionConfig.state,
          estimatedMinutes: actionConfig.estimatedMinutes,
          trigger: actionConfig.trigger,
          recurrencePattern: actionConfig.recurrencePattern,
          createdAt: now,
          updatedAt: now,
        };

        // Validate action
        ActionSchema.parse(action);
        actions.push(action);
      }
    }
  }

  // Create onboarding status
  const onboardingStatus: OnboardingStatus = {
    userId,
    isOnboarded: true,
    onboardingVersion: config.version,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  return {
    drivers,
    milestones,
    actions,
    onboardingStatus,
  };
}

/**
 * Validates onboarding configuration structure
 *
 * @param config - The configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateOnboardingConfig(config: unknown): asserts config is OnboardingConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Onboarding config must be an object');
  }

  const cfg = config as Record<string, unknown>;

  if (typeof cfg.version !== 'string') {
    throw new Error('Onboarding config must have a version string');
  }

  if (!Array.isArray(cfg.drivers) || cfg.drivers.length === 0) {
    throw new Error('Onboarding config must have at least one driver');
  }

  // Validate each driver has required structure
  for (const driver of cfg.drivers) {
    if (!driver || typeof driver !== 'object') {
      throw new Error('Each driver must be an object');
    }

    const d = driver as Record<string, unknown>;

    if (typeof d.title !== 'string' || d.title.length === 0) {
      throw new Error('Each driver must have a title');
    }

    if (typeof d.isActive !== 'boolean') {
      throw new Error('Each driver must have an isActive boolean');
    }

    if (!Array.isArray(d.milestones) || d.milestones.length === 0) {
      throw new Error('Each driver must have at least one milestone');
    }

    // Validate each milestone has required structure
    for (const milestone of d.milestones) {
      if (!milestone || typeof milestone !== 'object') {
        throw new Error('Each milestone must be an object');
      }

      const m = milestone as Record<string, unknown>;

      if (typeof m.title !== 'string' || m.title.length === 0) {
        throw new Error('Each milestone must have a title');
      }

      if (!Array.isArray(m.actions) || m.actions.length === 0) {
        throw new Error('Each milestone must have at least one action');
      }

      // Validate each action has required structure
      for (const action of m.actions) {
        if (!action || typeof action !== 'object') {
          throw new Error('Each action must be an object');
        }

        const a = action as Record<string, unknown>;

        if (typeof a.title !== 'string' || a.title.length === 0) {
          throw new Error('Each action must have a title');
        }

        if (typeof a.state !== 'string') {
          throw new Error('Each action must have a state');
        }

        const validStates = ['planned', 'in-progress', 'completed', 'deferred', 'rolled-over'];
        if (!validStates.includes(a.state)) {
          throw new Error(`Invalid action state: ${a.state}`);
        }
      }
    }
  }
}
