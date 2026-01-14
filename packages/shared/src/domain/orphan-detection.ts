/**
 * Orphan detection logic for domain entities
 *
 * Ensures all entities maintain proper hierarchical relationships:
 * - Actions must link to valid Milestones
 * - Milestones must link to valid Drivers
 * - Drivers without Milestones are considered orphaned
 */

import { Driver, Milestone, Action, OrphanDetectionResult } from '../types/domain';

/**
 * Detects orphaned entities in the domain model
 *
 * @param drivers - All drivers to check
 * @param milestones - All milestones to check
 * @param actions - All actions to check
 * @returns Detection result with lists of orphaned entities
 */
export function detectOrphans(
  drivers: Driver[],
  milestones: Milestone[],
  actions: Action[]
): OrphanDetectionResult {
  const driverIds = new Set(drivers.map(d => d.id));
  const milestoneIds = new Set(milestones.map(m => m.id));

  // Find milestones that reference non-existent drivers
  const orphanedMilestones = milestones.filter(milestone => !driverIds.has(milestone.driverId));

  // Find actions that reference non-existent milestones
  const orphanedActions = actions.filter(action => !milestoneIds.has(action.milestoneId));

  // Find drivers that have no milestones
  const driversWithMilestones = new Set(milestones.map(m => m.driverId));
  const orphanedDrivers = drivers.filter(driver => !driversWithMilestones.has(driver.id));

  return {
    orphanedActions,
    orphanedMilestones,
    orphanedDrivers,
  };
}

/**
 * Checks if an action would be orphaned if created
 *
 * @param milestoneId - The milestone ID the action would link to
 * @param milestones - All available milestones
 * @returns true if the action would be orphaned
 */
export function wouldActionBeOrphaned(milestoneId: string, milestones: Milestone[]): boolean {
  return !milestones.some(m => m.id === milestoneId);
}

/**
 * Checks if a milestone would be orphaned if created
 *
 * @param driverId - The driver ID the milestone would link to
 * @param drivers - All available drivers
 * @returns true if the milestone would be orphaned
 */
export function wouldMilestoneBeOrphaned(driverId: string, drivers: Driver[]): boolean {
  return !drivers.some(d => d.id === driverId);
}

/**
 * Validates that an action can be created without becoming orphaned
 *
 * @param milestoneId - The milestone ID the action would link to
 * @param milestones - All available milestones
 * @throws {Error} If the action would be orphaned
 */
export function validateActionNotOrphaned(milestoneId: string, milestones: Milestone[]): void {
  if (wouldActionBeOrphaned(milestoneId, milestones)) {
    throw new Error('Actions must be linked to a milestone');
  }
}

/**
 * Validates that a milestone can be created without becoming orphaned
 *
 * @param driverId - The driver ID the milestone would link to
 * @param drivers - All available drivers
 * @throws {Error} If the milestone would be orphaned
 */
export function validateMilestoneNotOrphaned(driverId: string, drivers: Driver[]): void {
  if (wouldMilestoneBeOrphaned(driverId, drivers)) {
    throw new Error('Milestones must be linked to a driver');
  }
}

/**
 * Gets the count of entities that would become orphaned if a driver is deleted
 *
 * @param driverId - The driver ID to delete
 * @param milestones - All milestones
 * @param actions - All actions
 * @returns Object with counts of affected milestones and actions
 */
export function getDeleteDriverImpact(
  driverId: string,
  milestones: Milestone[],
  actions: Action[]
): { affectedMilestones: number; affectedActions: number } {
  const affectedMilestones = milestones.filter(m => m.driverId === driverId);
  const affectedMilestoneIds = new Set(affectedMilestones.map(m => m.id));
  const affectedActions = actions.filter(a => affectedMilestoneIds.has(a.milestoneId));

  return {
    affectedMilestones: affectedMilestones.length,
    affectedActions: affectedActions.length,
  };
}

/**
 * Gets the count of entities that would become orphaned if a milestone is deleted
 *
 * @param milestoneId - The milestone ID to delete
 * @param actions - All actions
 * @returns Count of affected actions
 */
export function getDeleteMilestoneImpact(milestoneId: string, actions: Action[]): number {
  return actions.filter(a => a.milestoneId === milestoneId).length;
}
