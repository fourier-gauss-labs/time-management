/**
 * DynamoDB single-table schema utilities
 *
 * Key Structure:
 * - PK: USER#<userId>#<entityType>#<entityId>
 * - SK: varies by entity type to support hierarchical queries
 *
 * Entity Types:
 * - DRIVER
 * - MILESTONE
 * - ACTION
 * - SNAPSHOT
 */

import { UserId, DriverId, MilestoneId, ActionId } from '../types/domain';

/**
 * Entity type discriminator
 */
export type EntityType = 'DRIVER' | 'MILESTONE' | 'ACTION' | 'SNAPSHOT';

/**
 * DynamoDB key structure
 */
export interface DynamoDBKey {
  PK: string;
  SK: string;
}

/**
 * Constructs a partition key for a driver
 *
 * @param userId - The user ID
 * @param driverId - The driver ID
 * @returns The partition key
 */
export function getDriverPK(userId: UserId, driverId: DriverId): string {
  return `USER#${userId}#DRIVER#${driverId}`;
}

/**
 * Constructs a sort key for a driver
 *
 * @param driverId - The driver ID
 * @returns The sort key
 */
export function getDriverSK(driverId: DriverId): string {
  return `DRIVER#${driverId}`;
}

/**
 * Constructs a partition key for a milestone
 *
 * @param userId - The user ID
 * @param milestoneId - The milestone ID
 * @returns The partition key
 */
export function getMilestonePK(userId: UserId, milestoneId: MilestoneId): string {
  return `USER#${userId}#MILESTONE#${milestoneId}`;
}

/**
 * Constructs a sort key for a milestone
 *
 * @param driverId - The driver ID this milestone belongs to
 * @param milestoneId - The milestone ID
 * @returns The sort key
 */
export function getMilestoneSK(driverId: DriverId, milestoneId: MilestoneId): string {
  return `DRIVER#${driverId}#MILESTONE#${milestoneId}`;
}

/**
 * Constructs a partition key for an action
 *
 * @param userId - The user ID
 * @param actionId - The action ID
 * @returns The partition key
 */
export function getActionPK(userId: UserId, actionId: ActionId): string {
  return `USER#${userId}#ACTION#${actionId}`;
}

/**
 * Constructs a sort key for an action
 *
 * @param milestoneId - The milestone ID this action belongs to
 * @param actionId - The action ID
 * @returns The sort key
 */
export function getActionSK(milestoneId: MilestoneId, actionId: ActionId): string {
  return `MILESTONE#${milestoneId}#ACTION#${actionId}`;
}

/**
 * Constructs a partition key for a daily snapshot
 *
 * @param userId - The user ID
 * @param date - The date string (YYYY-MM-DD)
 * @returns The partition key
 */
export function getSnapshotPK(userId: UserId, date: string): string {
  return `USER#${userId}#SNAPSHOT#${date}`;
}

/**
 * Constructs a sort key for a daily snapshot
 *
 * @param date - The date string (YYYY-MM-DD)
 * @returns The sort key
 */
export function getSnapshotSK(date: string): string {
  return `SNAPSHOT#${date}`;
}

/**
 * Constructs a query prefix for all entities of a type for a user
 *
 * @param userId - The user ID
 * @param entityType - The entity type
 * @returns The query prefix
 */
export function getUserEntityPrefix(userId: UserId, entityType: EntityType): string {
  return `USER#${userId}#${entityType}#`;
}

/**
 * Extracts the entity ID from a partition key
 *
 * @param pk - The partition key
 * @returns The entity ID
 */
export function extractEntityId(pk: string): string {
  const parts = pk.split('#');
  return parts[parts.length - 1];
}

/**
 * Extracts the user ID from a partition key
 *
 * @param pk - The partition key
 * @returns The user ID
 */
export function extractUserId(pk: string): string {
  const parts = pk.split('#');
  if (parts[0] === 'USER') {
    return parts[1];
  }
  throw new Error(`Invalid partition key format: ${pk}`);
}

/**
 * Extracts the entity type from a partition key
 *
 * @param pk - The partition key
 * @returns The entity type
 */
export function extractEntityType(pk: string): EntityType {
  const parts = pk.split('#');
  if (parts.length >= 3) {
    const type = parts[2];
    if (['DRIVER', 'MILESTONE', 'ACTION', 'SNAPSHOT'].includes(type)) {
      return type as EntityType;
    }
  }
  throw new Error(`Invalid partition key format: ${pk}`);
}

/**
 * Constructs a complete DynamoDB key for a driver
 */
export function getDriverKey(userId: UserId, driverId: DriverId): DynamoDBKey {
  return {
    PK: getDriverPK(userId, driverId),
    SK: getDriverSK(driverId),
  };
}

/**
 * Constructs a complete DynamoDB key for a milestone
 */
export function getMilestoneKey(
  userId: UserId,
  driverId: DriverId,
  milestoneId: MilestoneId
): DynamoDBKey {
  return {
    PK: getMilestonePK(userId, milestoneId),
    SK: getMilestoneSK(driverId, milestoneId),
  };
}

/**
 * Constructs a complete DynamoDB key for an action
 */
export function getActionKey(
  userId: UserId,
  milestoneId: MilestoneId,
  actionId: ActionId
): DynamoDBKey {
  return {
    PK: getActionPK(userId, actionId),
    SK: getActionSK(milestoneId, actionId),
  };
}

/**
 * Constructs a complete DynamoDB key for a snapshot
 */
export function getSnapshotKey(userId: UserId, date: string): DynamoDBKey {
  return {
    PK: getSnapshotPK(userId, date),
    SK: getSnapshotSK(date),
  };
}
