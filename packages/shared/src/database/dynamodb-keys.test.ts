/**
 * Tests for DynamoDB key construction utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getDriverPK,
  getDriverSK,
  getMilestonePK,
  getMilestoneSK,
  getActionPK,
  getActionSK,
  getSnapshotPK,
  getSnapshotSK,
  getUserEntityPrefix,
  extractEntityId,
  extractUserId,
  extractEntityType,
  getDriverKey,
  getMilestoneKey,
  getActionKey,
  getSnapshotKey,
} from '../database/dynamodb-keys';

describe('Driver keys', () => {
  it('should construct driver PK correctly', () => {
    const pk = getDriverPK('user123', 'driver456');
    expect(pk).toBe('USER#user123#DRIVER#driver456');
  });

  it('should construct driver SK correctly', () => {
    const sk = getDriverSK('driver456');
    expect(sk).toBe('DRIVER#driver456');
  });

  it('should construct complete driver key', () => {
    const key = getDriverKey('user123', 'driver456');
    expect(key).toEqual({
      PK: 'USER#user123#DRIVER#driver456',
      SK: 'DRIVER#driver456',
    });
  });
});

describe('Milestone keys', () => {
  it('should construct milestone PK correctly', () => {
    const pk = getMilestonePK('user123', 'milestone789');
    expect(pk).toBe('USER#user123#MILESTONE#milestone789');
  });

  it('should construct milestone SK correctly', () => {
    const sk = getMilestoneSK('driver456', 'milestone789');
    expect(sk).toBe('DRIVER#driver456#MILESTONE#milestone789');
  });

  it('should construct complete milestone key', () => {
    const key = getMilestoneKey('user123', 'driver456', 'milestone789');
    expect(key).toEqual({
      PK: 'USER#user123#MILESTONE#milestone789',
      SK: 'DRIVER#driver456#MILESTONE#milestone789',
    });
  });
});

describe('Action keys', () => {
  it('should construct action PK correctly', () => {
    const pk = getActionPK('user123', 'action999');
    expect(pk).toBe('USER#user123#ACTION#action999');
  });

  it('should construct action SK correctly', () => {
    const sk = getActionSK('milestone789', 'action999');
    expect(sk).toBe('MILESTONE#milestone789#ACTION#action999');
  });

  it('should construct complete action key', () => {
    const key = getActionKey('user123', 'milestone789', 'action999');
    expect(key).toEqual({
      PK: 'USER#user123#ACTION#action999',
      SK: 'MILESTONE#milestone789#ACTION#action999',
    });
  });
});

describe('Snapshot keys', () => {
  it('should construct snapshot PK correctly', () => {
    const pk = getSnapshotPK('user123', '2026-01-13');
    expect(pk).toBe('USER#user123#SNAPSHOT#2026-01-13');
  });

  it('should construct snapshot SK correctly', () => {
    const sk = getSnapshotSK('2026-01-13');
    expect(sk).toBe('SNAPSHOT#2026-01-13');
  });

  it('should construct complete snapshot key', () => {
    const key = getSnapshotKey('user123', '2026-01-13');
    expect(key).toEqual({
      PK: 'USER#user123#SNAPSHOT#2026-01-13',
      SK: 'SNAPSHOT#2026-01-13',
    });
  });
});

describe('getUserEntityPrefix', () => {
  it('should construct prefix for drivers', () => {
    const prefix = getUserEntityPrefix('user123', 'DRIVER');
    expect(prefix).toBe('USER#user123#DRIVER#');
  });

  it('should construct prefix for milestones', () => {
    const prefix = getUserEntityPrefix('user123', 'MILESTONE');
    expect(prefix).toBe('USER#user123#MILESTONE#');
  });

  it('should construct prefix for actions', () => {
    const prefix = getUserEntityPrefix('user123', 'ACTION');
    expect(prefix).toBe('USER#user123#ACTION#');
  });

  it('should construct prefix for snapshots', () => {
    const prefix = getUserEntityPrefix('user123', 'SNAPSHOT');
    expect(prefix).toBe('USER#user123#SNAPSHOT#');
  });
});

describe('extractEntityId', () => {
  it('should extract entity ID from driver PK', () => {
    const id = extractEntityId('USER#user123#DRIVER#driver456');
    expect(id).toBe('driver456');
  });

  it('should extract entity ID from milestone PK', () => {
    const id = extractEntityId('USER#user123#MILESTONE#milestone789');
    expect(id).toBe('milestone789');
  });

  it('should extract entity ID from action PK', () => {
    const id = extractEntityId('USER#user123#ACTION#action999');
    expect(id).toBe('action999');
  });

  it('should extract date from snapshot PK', () => {
    const id = extractEntityId('USER#user123#SNAPSHOT#2026-01-13');
    expect(id).toBe('2026-01-13');
  });
});

describe('extractUserId', () => {
  it('should extract user ID from driver PK', () => {
    const userId = extractUserId('USER#user123#DRIVER#driver456');
    expect(userId).toBe('user123');
  });

  it('should extract user ID from milestone PK', () => {
    const userId = extractUserId('USER#user123#MILESTONE#milestone789');
    expect(userId).toBe('user123');
  });

  it('should extract user ID from action PK', () => {
    const userId = extractUserId('USER#user123#ACTION#action999');
    expect(userId).toBe('user123');
  });

  it('should extract user ID from snapshot PK', () => {
    const userId = extractUserId('USER#user123#SNAPSHOT#2026-01-13');
    expect(userId).toBe('user123');
  });

  it('should throw error for invalid PK format', () => {
    expect(() => extractUserId('INVALID#format')).toThrow('Invalid partition key format');
  });
});

describe('extractEntityType', () => {
  it('should extract DRIVER type from PK', () => {
    const type = extractEntityType('USER#user123#DRIVER#driver456');
    expect(type).toBe('DRIVER');
  });

  it('should extract MILESTONE type from PK', () => {
    const type = extractEntityType('USER#user123#MILESTONE#milestone789');
    expect(type).toBe('MILESTONE');
  });

  it('should extract ACTION type from PK', () => {
    const type = extractEntityType('USER#user123#ACTION#action999');
    expect(type).toBe('ACTION');
  });

  it('should extract SNAPSHOT type from PK', () => {
    const type = extractEntityType('USER#user123#SNAPSHOT#2026-01-13');
    expect(type).toBe('SNAPSHOT');
  });

  it('should throw error for invalid PK format', () => {
    expect(() => extractEntityType('USER#user123')).toThrow('Invalid partition key format');
  });

  it('should throw error for unknown entity type', () => {
    expect(() => extractEntityType('USER#user123#UNKNOWN#id')).toThrow(
      'Invalid partition key format'
    );
  });
});

describe('Key consistency', () => {
  it('should ensure PK includes user ID for isolation', () => {
    const driverKey = getDriverKey('user1', 'driver1');
    const milestoneKey = getMilestoneKey('user1', 'driver1', 'milestone1');
    const actionKey = getActionKey('user1', 'milestone1', 'action1');
    const snapshotKey = getSnapshotKey('user1', '2026-01-13');

    expect(driverKey.PK).toContain('user1');
    expect(milestoneKey.PK).toContain('user1');
    expect(actionKey.PK).toContain('user1');
    expect(snapshotKey.PK).toContain('user1');
  });

  it('should ensure SK maintains hierarchical relationships', () => {
    const milestoneKey = getMilestoneKey('user1', 'driver1', 'milestone1');
    const actionKey = getActionKey('user1', 'milestone1', 'action1');

    expect(milestoneKey.SK).toContain('driver1');
    expect(actionKey.SK).toContain('milestone1');
  });
});
