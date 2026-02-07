/**
 * DynamoDB Key Generation Utilities
 *
 * This module provides functions to generate consistent partition keys (PK)
 * and sort keys (SK) for the single-table design.
 */

import type { UserId } from '../types/domain';

/**
 * Generate user partition key
 */
export function getUserPK(userId: UserId): string {
  return `U#${userId}`;
}

/**
 * Values Tree Keys
 */

export function getValuesHeadSK(): string {
  return 'HEAD#VALUES';
}

export function getValuesRevisionSK(timestamp: string, revId: string): string {
  return `REV#VALUES#${timestamp}#${revId}`;
}

export function getValuesSnapshotPK(userId: UserId, revId: string): string {
  return `U#${userId}#VALUES#${revId}`;
}

export function getNodeSK(nodeId: string): string {
  return `NODE#${nodeId}`;
}

export function getEdgeSK(parentNodeId: string, order: number, childNodeId: string): string {
  // Pad order to 5 digits for proper sorting
  const paddedOrder = order.toString().padStart(5, '0');
  return `EDGE#${parentNodeId}#${paddedOrder}#${childNodeId}`;
}

/**
 * Daily Plan Keys
 */

export function getDailyPlanPK(userId: UserId, date: string): string {
  return `U#${userId}#PLAN#${date}`;
}

export function getDailyPlanHeadSK(): string {
  return 'HEAD';
}

export function getDailyPlanRevisionSK(timestamp: string, revId: string): string {
  return `REV#${timestamp}#${revId}`;
}

export function getDailyPlanSnapshotPK(userId: UserId, date: string, revId: string): string {
  return `U#${userId}#PLAN#${date}#${revId}`;
}

export function getTodoSK(order: number, actionId: string): string {
  // Pad order to 3 digits for proper sorting
  const paddedOrder = order.toString().padStart(3, '0');
  return `TODO#${paddedOrder}#A#${actionId}`;
}

export function getBlockSK(startTimeIso: string, blockId: string): string {
  return `BLOCK#${startTimeIso}#${blockId}`;
}

/**
 * Parse helpers for extracting IDs from sort keys
 */

export function parseNodeId(sk: string): string | null {
  const match = sk.match(/^NODE#(.+)$/);
  return match ? match[1] : null;
}

export function parseEdge(
  sk: string
): { parentNodeId: string; order: number; childNodeId: string } | null {
  const match = sk.match(/^EDGE#([^#]+)#(\d+)#(.+)$/);
  if (!match) return null;

  return {
    parentNodeId: match[1],
    order: parseInt(match[2], 10),
    childNodeId: match[3],
  };
}

export function parseTodoActionId(sk: string): string | null {
  const match = sk.match(/^TODO#\d+#A#(.+)$/);
  return match ? match[1] : null;
}
