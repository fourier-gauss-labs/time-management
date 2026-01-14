/**
 * Tests for orphan detection logic
 */

import { describe, it, expect } from 'vitest';
import {
  detectOrphans,
  wouldActionBeOrphaned,
  wouldMilestoneBeOrphaned,
  validateActionNotOrphaned,
  validateMilestoneNotOrphaned,
  getDeleteDriverImpact,
  getDeleteMilestoneImpact,
} from '../domain/orphan-detection';
import {
  createTestDriver,
  createTestMilestone,
  createTestAction,
  createTestHierarchy,
  createTestMilestones,
  createTestActions,
} from '../test/fixtures';

describe('detectOrphans', () => {
  it('should return empty arrays when no orphans exist', () => {
    const { driver, milestone, action } = createTestHierarchy();
    const result = detectOrphans([driver], [milestone], [action]);

    expect(result.orphanedActions).toHaveLength(0);
    expect(result.orphanedMilestones).toHaveLength(0);
    expect(result.orphanedDrivers).toHaveLength(0);
  });

  it('should detect orphaned actions', () => {
    const driver = createTestDriver();
    const milestone = createTestMilestone({ driverId: driver.id });
    const orphanedAction = createTestAction({ milestoneId: 'non-existent-milestone' });
    const validAction = createTestAction({ milestoneId: milestone.id });

    const result = detectOrphans([driver], [milestone], [orphanedAction, validAction]);

    expect(result.orphanedActions).toHaveLength(1);
    expect(result.orphanedActions[0]).toEqual(orphanedAction);
    expect(result.orphanedMilestones).toHaveLength(0);
  });

  it('should detect orphaned milestones', () => {
    const driver = createTestDriver();
    const orphanedMilestone = createTestMilestone({ driverId: 'non-existent-driver' });
    const validMilestone = createTestMilestone({ driverId: driver.id });

    const result = detectOrphans([driver], [orphanedMilestone, validMilestone], []);

    expect(result.orphanedMilestones).toHaveLength(1);
    expect(result.orphanedMilestones[0]).toEqual(orphanedMilestone);
    expect(result.orphanedActions).toHaveLength(0);
  });

  it('should detect orphaned drivers (without milestones)', () => {
    const driverWithMilestones = createTestDriver();
    const orphanedDriver = createTestDriver();
    const milestone = createTestMilestone({ driverId: driverWithMilestones.id });

    const result = detectOrphans([driverWithMilestones, orphanedDriver], [milestone], []);

    expect(result.orphanedDrivers).toHaveLength(1);
    expect(result.orphanedDrivers[0]).toEqual(orphanedDriver);
  });

  it('should detect multiple types of orphans simultaneously', () => {
    const driver = createTestDriver();
    const orphanedDriver = createTestDriver();
    const milestone = createTestMilestone({ driverId: driver.id });
    const orphanedMilestone = createTestMilestone({ driverId: 'non-existent-driver' });
    const action = createTestAction({ milestoneId: milestone.id });
    const orphanedAction = createTestAction({ milestoneId: 'non-existent-milestone' });

    const result = detectOrphans(
      [driver, orphanedDriver],
      [milestone, orphanedMilestone],
      [action, orphanedAction]
    );

    expect(result.orphanedActions).toHaveLength(1);
    expect(result.orphanedMilestones).toHaveLength(1);
    expect(result.orphanedDrivers).toHaveLength(1);
  });
});

describe('wouldActionBeOrphaned', () => {
  it('should return false if milestone exists', () => {
    const milestone = createTestMilestone();
    const result = wouldActionBeOrphaned(milestone.id, [milestone]);
    expect(result).toBe(false);
  });

  it('should return true if milestone does not exist', () => {
    const milestone = createTestMilestone();
    const result = wouldActionBeOrphaned('non-existent-milestone', [milestone]);
    expect(result).toBe(true);
  });

  it('should return true if milestones array is empty', () => {
    const result = wouldActionBeOrphaned('any-milestone-id', []);
    expect(result).toBe(true);
  });
});

describe('wouldMilestoneBeOrphaned', () => {
  it('should return false if driver exists', () => {
    const driver = createTestDriver();
    const result = wouldMilestoneBeOrphaned(driver.id, [driver]);
    expect(result).toBe(false);
  });

  it('should return true if driver does not exist', () => {
    const driver = createTestDriver();
    const result = wouldMilestoneBeOrphaned('non-existent-driver', [driver]);
    expect(result).toBe(true);
  });

  it('should return true if drivers array is empty', () => {
    const result = wouldMilestoneBeOrphaned('any-driver-id', []);
    expect(result).toBe(true);
  });
});

describe('validateActionNotOrphaned', () => {
  it('should not throw if milestone exists', () => {
    const milestone = createTestMilestone();
    expect(() => validateActionNotOrphaned(milestone.id, [milestone])).not.toThrow();
  });

  it('should throw if milestone does not exist', () => {
    const milestone = createTestMilestone();
    expect(() => validateActionNotOrphaned('non-existent-milestone', [milestone])).toThrow(
      'Actions must be linked to a milestone'
    );
  });
});

describe('validateMilestoneNotOrphaned', () => {
  it('should not throw if driver exists', () => {
    const driver = createTestDriver();
    expect(() => validateMilestoneNotOrphaned(driver.id, [driver])).not.toThrow();
  });

  it('should throw if driver does not exist', () => {
    const driver = createTestDriver();
    expect(() => validateMilestoneNotOrphaned('non-existent-driver', [driver])).toThrow(
      'Milestones must be linked to a driver'
    );
  });
});

describe('getDeleteDriverImpact', () => {
  it('should return zero impact if driver has no milestones', () => {
    const driver = createTestDriver();
    const result = getDeleteDriverImpact(driver.id, [], []);

    expect(result.affectedMilestones).toBe(0);
    expect(result.affectedActions).toBe(0);
  });

  it('should count affected milestones', () => {
    const driver = createTestDriver();
    const milestones = createTestMilestones(3, driver.id);

    const result = getDeleteDriverImpact(driver.id, milestones, []);

    expect(result.affectedMilestones).toBe(3);
    expect(result.affectedActions).toBe(0);
  });

  it('should count affected actions through milestones', () => {
    const driver = createTestDriver();
    const milestones = createTestMilestones(2, driver.id);
    const actions1 = createTestActions(3, milestones[0].id);
    const actions2 = createTestActions(2, milestones[1].id);

    const result = getDeleteDriverImpact(driver.id, milestones, [...actions1, ...actions2]);

    expect(result.affectedMilestones).toBe(2);
    expect(result.affectedActions).toBe(5);
  });

  it('should not count unrelated milestones and actions', () => {
    const driver1 = createTestDriver();
    const driver2 = createTestDriver();
    const milestones1 = createTestMilestones(2, driver1.id);
    const milestones2 = createTestMilestones(1, driver2.id);
    const actions = createTestActions(3, milestones1[0].id);

    const result = getDeleteDriverImpact(driver1.id, [...milestones1, ...milestones2], actions);

    expect(result.affectedMilestones).toBe(2);
    expect(result.affectedActions).toBe(3);
  });
});

describe('getDeleteMilestoneImpact', () => {
  it('should return zero if milestone has no actions', () => {
    const milestone = createTestMilestone();
    const result = getDeleteMilestoneImpact(milestone.id, []);
    expect(result).toBe(0);
  });

  it('should count affected actions', () => {
    const milestone = createTestMilestone();
    const actions = createTestActions(5, milestone.id);

    const result = getDeleteMilestoneImpact(milestone.id, actions);
    expect(result).toBe(5);
  });

  it('should not count unrelated actions', () => {
    const milestone1 = createTestMilestone();
    const milestone2 = createTestMilestone();
    const actions1 = createTestActions(3, milestone1.id);
    const actions2 = createTestActions(2, milestone2.id);

    const result = getDeleteMilestoneImpact(milestone1.id, [...actions1, ...actions2]);
    expect(result).toBe(3);
  });
});
