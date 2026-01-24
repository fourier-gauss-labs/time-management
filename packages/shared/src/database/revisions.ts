/**
 * Revision Management Utilities
 *
 * Helper functions for creating and managing snapshot revisions.
 */

import { randomUUID } from 'crypto';

/**
 * Generate a new revision ID
 */
export function generateRevisionId(): string {
  return randomUUID();
}

/**
 * Generate ISO timestamp for revision
 */
export function generateRevisionTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a revision identifier (timestamp + revId)
 */
export interface RevisionIdentifier {
  revId: string;
  timestamp: string;
}

export function createRevisionIdentifier(): RevisionIdentifier {
  return {
    revId: generateRevisionId(),
    timestamp: generateRevisionTimestamp(),
  };
}
