/**
 * Tests for onboarding business logic
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultEntities,
  validateOnboardingConfig,
  type OnboardingConfig,
} from '../domain/onboarding';

describe('Onboarding Logic', () => {
  const validConfig: OnboardingConfig = {
    version: '1.0.0',
    drivers: [
      {
        title: 'Test Driver',
        description: 'A test driver',
        isActive: true,
        milestones: [
          {
            title: 'Test Milestone',
            description: 'A test milestone',
            actions: [
              {
                title: 'Test Action',
                description: 'A test action',
                state: 'planned',
                estimatedMinutes: 30,
              },
            ],
          },
        ],
      },
    ],
  };

  describe('createDefaultEntities', () => {
    it('should create drivers, milestones, and actions from config', () => {
      const userId = 'test-user-123';
      const result = createDefaultEntities(userId, validConfig);

      expect(result.drivers).toHaveLength(1);
      expect(result.milestones).toHaveLength(1);
      expect(result.actions).toHaveLength(1);

      expect(result.drivers[0].title).toBe('Test Driver');
      expect(result.drivers[0].userId).toBe(userId);
      expect(result.drivers[0].isActive).toBe(true);

      expect(result.milestones[0].title).toBe('Test Milestone');
      expect(result.milestones[0].driverId).toBe(result.drivers[0].id);

      expect(result.actions[0].title).toBe('Test Action');
      expect(result.actions[0].milestoneId).toBe(result.milestones[0].id);
    });

    it('should create onboarding status with correct version', () => {
      const userId = 'test-user-123';
      const result = createDefaultEntities(userId, validConfig);

      expect(result.onboardingStatus.userId).toBe(userId);
      expect(result.onboardingStatus.isOnboarded).toBe(true);
      expect(result.onboardingStatus.onboardingVersion).toBe('1.0.0');
      expect(result.onboardingStatus.completedAt).toBeDefined();
    });

    it('should generate unique IDs for all entities', () => {
      const userId = 'test-user-123';
      const result = createDefaultEntities(userId, validConfig);

      const driverIds = result.drivers.map(d => d.id);
      const milestoneIds = result.milestones.map(m => m.id);
      const actionIds = result.actions.map(a => a.id);

      const allIds = [...driverIds, ...milestoneIds, ...actionIds];
      const uniqueIds = new Set(allIds);

      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('should handle multiple drivers with multiple milestones and actions', () => {
      const multiConfig: OnboardingConfig = {
        version: '1.0.0',
        drivers: [
          {
            title: 'Driver 1',
            isActive: true,
            milestones: [
              {
                title: 'Milestone 1.1',
                actions: [
                  { title: 'Action 1.1.1', state: 'planned' },
                  { title: 'Action 1.1.2', state: 'planned' },
                ],
              },
              {
                title: 'Milestone 1.2',
                actions: [{ title: 'Action 1.2.1', state: 'planned' }],
              },
            ],
          },
          {
            title: 'Driver 2',
            isActive: true,
            milestones: [
              {
                title: 'Milestone 2.1',
                actions: [{ title: 'Action 2.1.1', state: 'planned' }],
              },
            ],
          },
        ],
      };

      const userId = 'test-user-123';
      const result = createDefaultEntities(userId, multiConfig);

      expect(result.drivers).toHaveLength(2);
      expect(result.milestones).toHaveLength(3);
      expect(result.actions).toHaveLength(4);

      // Verify relationships
      const driver1 = result.drivers.find(d => d.title === 'Driver 1');
      const driver2 = result.drivers.find(d => d.title === 'Driver 2');

      expect(driver1).toBeDefined();
      expect(driver2).toBeDefined();

      const driver1Milestones = result.milestones.filter(m => m.driverId === driver1!.id);
      const driver2Milestones = result.milestones.filter(m => m.driverId === driver2!.id);

      expect(driver1Milestones).toHaveLength(2);
      expect(driver2Milestones).toHaveLength(1);
    });

    it('should preserve recurrence patterns from config', () => {
      const configWithRecurrence: OnboardingConfig = {
        version: '1.0.0',
        drivers: [
          {
            title: 'Habit Driver',
            isActive: true,
            milestones: [
              {
                title: 'Daily Habits',
                actions: [
                  {
                    title: 'Morning routine',
                    state: 'planned',
                    recurrencePattern: {
                      frequency: 'daily',
                    },
                  },
                  {
                    title: 'Weekly review',
                    state: 'planned',
                    recurrencePattern: {
                      frequency: 'weekly',
                      interval: [0],
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = createDefaultEntities('user-123', configWithRecurrence);

      const dailyAction = result.actions.find(a => a.title === 'Morning routine');
      const weeklyAction = result.actions.find(a => a.title === 'Weekly review');

      expect(dailyAction?.recurrencePattern).toEqual({ frequency: 'daily' });
      expect(weeklyAction?.recurrencePattern).toEqual({
        frequency: 'weekly',
        interval: [0],
      });
    });

    it('should set timestamps on all entities', () => {
      const userId = 'test-user-123';
      const result = createDefaultEntities(userId, validConfig);

      for (const driver of result.drivers) {
        expect(driver.createdAt).toBeDefined();
        expect(driver.updatedAt).toBeDefined();
      }

      for (const milestone of result.milestones) {
        expect(milestone.createdAt).toBeDefined();
        expect(milestone.updatedAt).toBeDefined();
      }

      for (const action of result.actions) {
        expect(action.createdAt).toBeDefined();
        expect(action.updatedAt).toBeDefined();
      }
    });
  });

  describe('validateOnboardingConfig', () => {
    it('should accept valid configuration', () => {
      expect(() => validateOnboardingConfig(validConfig)).not.toThrow();
    });

    it('should reject non-object config', () => {
      expect(() => validateOnboardingConfig(null)).toThrow('must be an object');
      expect(() => validateOnboardingConfig('invalid')).toThrow('must be an object');
      expect(() => validateOnboardingConfig(123)).toThrow('must be an object');
    });

    it('should reject config without version', () => {
      const noVersion = { ...validConfig, version: undefined };
      expect(() => validateOnboardingConfig(noVersion)).toThrow('must have a version string');
    });

    it('should reject config without drivers', () => {
      const noDrivers = { version: '1.0.0' };
      expect(() => validateOnboardingConfig(noDrivers)).toThrow('must have at least one driver');
    });

    it('should reject config with empty drivers array', () => {
      const emptyDrivers = { version: '1.0.0', drivers: [] };
      expect(() => validateOnboardingConfig(emptyDrivers)).toThrow('must have at least one driver');
    });

    it('should reject driver without title', () => {
      const noTitle = {
        version: '1.0.0',
        drivers: [{ isActive: true, milestones: [] }],
      };
      expect(() => validateOnboardingConfig(noTitle)).toThrow('must have a title');
    });

    it('should reject driver without isActive', () => {
      const noIsActive = {
        version: '1.0.0',
        drivers: [{ title: 'Test', milestones: [] }],
      };
      expect(() => validateOnboardingConfig(noIsActive)).toThrow('must have an isActive boolean');
    });

    it('should reject driver without milestones', () => {
      const noMilestones = {
        version: '1.0.0',
        drivers: [{ title: 'Test', isActive: true }],
      };
      expect(() => validateOnboardingConfig(noMilestones)).toThrow(
        'must have at least one milestone'
      );
    });

    it('should reject milestone without title', () => {
      const noMilestoneTitle = {
        version: '1.0.0',
        drivers: [
          {
            title: 'Test',
            isActive: true,
            milestones: [{ actions: [] }],
          },
        ],
      };
      expect(() => validateOnboardingConfig(noMilestoneTitle)).toThrow('must have a title');
    });

    it('should reject milestone without actions', () => {
      const noActions = {
        version: '1.0.0',
        drivers: [
          {
            title: 'Test',
            isActive: true,
            milestones: [{ title: 'Milestone' }],
          },
        ],
      };
      expect(() => validateOnboardingConfig(noActions)).toThrow('must have at least one action');
    });

    it('should reject action without title', () => {
      const noActionTitle = {
        version: '1.0.0',
        drivers: [
          {
            title: 'Test',
            isActive: true,
            milestones: [
              {
                title: 'Milestone',
                actions: [{ state: 'planned' }],
              },
            ],
          },
        ],
      };
      expect(() => validateOnboardingConfig(noActionTitle)).toThrow('must have a title');
    });

    it('should reject action without state', () => {
      const noState = {
        version: '1.0.0',
        drivers: [
          {
            title: 'Test',
            isActive: true,
            milestones: [
              {
                title: 'Milestone',
                actions: [{ title: 'Action' }],
              },
            ],
          },
        ],
      };
      expect(() => validateOnboardingConfig(noState)).toThrow('must have a state');
    });

    it('should reject action with invalid state', () => {
      const invalidState = {
        version: '1.0.0',
        drivers: [
          {
            title: 'Test',
            isActive: true,
            milestones: [
              {
                title: 'Milestone',
                actions: [{ title: 'Action', state: 'invalid' }],
              },
            ],
          },
        ],
      };
      expect(() => validateOnboardingConfig(invalidState)).toThrow('Invalid action state');
    });
  });
});
