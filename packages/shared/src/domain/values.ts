/**
 * Domain Types for Values Tree Repository
 *
 * This represents the hierarchy of drivers, milestones, and actions
 * with full version control semantics.
 *
 * Note: These are the NEW architecture types. Old types exist in types/domain.ts
 * for backward compatibility during migration.
 */

import type { UserId, DriverId, MilestoneId, ActionId } from '../types/domain';

/**
 * Node Types
 */

export type NodeType = 'DRIVER' | 'MILESTONE' | 'ACTION';

export interface BaseNode {
  nodeType: NodeType;
  id: string;
  userId: UserId;
  title: string;
  notes?: string;
  createdAt: string;
  archived?: boolean;
  deletedAt?: string;
}

export interface DriverNode extends BaseNode {
  nodeType: 'DRIVER';
  id: DriverId;
}

export interface MilestoneNode extends BaseNode {
  nodeType: 'MILESTONE';
  id: MilestoneId;
  driverId: DriverId;
  parentMilestoneId?: MilestoneId;
  completedAt?: string;
}

export interface ActionNode extends BaseNode {
  nodeType: 'ACTION';
  id: ActionId;
  driverId: DriverId;
  parentMilestoneId?: MilestoneId;
  estimatedMinutes?: number;
  trigger?: string;
  completedAt?: string;
}

export type ValueNode = DriverNode | MilestoneNode | ActionNode;

/**
 * Edge (Hierarchy Relationship)
 */

export interface Edge {
  PK: string;
  SK: string;
  parentNodeId: string;
  childNodeId: string;
  childNodeType: NodeType;
  order: number;
}

/**
 * Values Metadata
 */

export interface ValuesHead {
  PK: string;
  SK: string;
  headRevId: string;
  headRevTs: string;
  updatedAt: string;
}

export interface ValuesRevision {
  PK: string;
  SK: string;
  revId: string;
  revTs: string;
  parentRevId?: string;
  message: string;
  source: 'weekly_review' | 'daily_update' | 'completion';
}

/**
 * Snapshot Item (stored in DynamoDB)
 *
 * Any node stored in a snapshot includes PK and SK
 */

export type ValueNodeItem = (DriverNode | MilestoneNode | ActionNode) & {
  PK: string;
  SK: string;
};

/**
 * Request/Response Types
 */

export interface CreateDriverRequest {
  title: string;
  notes?: string;
}

export interface UpdateDriverRequest {
  title?: string;
  notes?: string;
  archived?: boolean;
}

export interface CreateMilestoneRequest {
  title: string;
  notes?: string;
  parentMilestoneId?: MilestoneId;
}

export interface UpdateMilestoneRequest {
  title?: string;
  notes?: string;
  archived?: boolean;
  completedAt?: string;
}

export interface CreateActionRequest {
  title: string;
  notes?: string;
  parentMilestoneId?: MilestoneId;
  estimatedMinutes?: number;
  trigger?: string;
}

export interface UpdateActionRequest {
  title?: string;
  notes?: string;
  estimatedMinutes?: number;
  trigger?: string;
  completedAt?: string;
  archived?: boolean;
}

/**
 * Hierarchy Response
 */

export interface NodeWithChildren {
  node: ValueNode;
  children: NodeWithChildren[];
}
