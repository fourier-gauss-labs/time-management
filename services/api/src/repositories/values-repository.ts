/**
 * Values Tree Repository
 *
 * This module provides functions for reading and writing to the values tree
 * using the new snapshot-based architecture.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import {
  getUserPK,
  getValuesHeadSK,
  getValuesRevisionSK,
  getValuesSnapshotPK,
  getNodeSK,
  getEdgeSK,
  createRevisionIdentifier,
  type ValuesHead,
  type ValuesRevision,
  type DriverNode,
  type MilestoneNode,
  type ActionNode,
  type ValueNode,
  type ValueNodeItem,
  type Edge,
  type UserId,
  type DriverId,
  type MilestoneId,
  type ActionId,
} from '@time-management/shared';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Get the current HEAD revision ID for a user's values tree
 */
export async function getCurrentRevisionId(userId: UserId): Promise<string | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: getUserPK(userId),
        SK: getValuesHeadSK(),
      },
    })
  );

  const head = result.Item as ValuesHead | undefined;
  return head?.headRevId || null;
}

/**
 * Get all nodes from the current snapshot
 */
export async function getCurrentSnapshot(userId: UserId): Promise<ValueNodeItem[]> {
  const revId = await getCurrentRevisionId(userId);
  if (!revId) {
    return [];
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :nodePrefix)',
      ExpressionAttributeValues: {
        ':pk': getValuesSnapshotPK(userId, revId),
        ':nodePrefix': 'NODE#',
      },
    })
  );

  return (result.Items || []) as ValueNodeItem[];
}

/**
 * Get all edges from the current snapshot
 */
export async function getCurrentEdges(userId: UserId): Promise<Edge[]> {
  const revId = await getCurrentRevisionId(userId);
  if (!revId) {
    return [];
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :edgePrefix)',
      ExpressionAttributeValues: {
        ':pk': getValuesSnapshotPK(userId, revId),
        ':edgePrefix': 'EDGE#',
      },
    })
  );

  return (result.Items || []) as Edge[];
}

/**
 * Get a specific node by ID from current snapshot
 */
export async function getNodeById(userId: UserId, nodeId: string): Promise<ValueNodeItem | null> {
  const revId = await getCurrentRevisionId(userId);
  if (!revId) {
    return null;
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: getValuesSnapshotPK(userId, revId),
        SK: getNodeSK(nodeId),
      },
    })
  );

  return (result.Item as ValueNodeItem) || null;
}

/**
 * Get children of a specific node
 */
export async function getNodeChildren(
  userId: UserId,
  parentNodeId: string
): Promise<ValueNodeItem[]> {
  const revId = await getCurrentRevisionId(userId);
  if (!revId) {
    return [];
  }

  // Get all edges for this parent
  const edgesResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :edgePrefix)',
      ExpressionAttributeValues: {
        ':pk': getValuesSnapshotPK(userId, revId),
        ':edgePrefix': `EDGE#${parentNodeId}#`,
      },
    })
  );

  const edges = (edgesResult.Items || []) as Edge[];

  // Get all child nodes
  const children: ValueNodeItem[] = [];
  for (const edge of edges) {
    const child = await getNodeById(userId, edge.childNodeId);
    if (child) {
      children.push(child);
    }
  }

  return children;
}

/**
 * Create a new revision with updated nodes and edges
 */
export async function createNewRevision(
  userId: UserId,
  message: string,
  source: 'weekly_review' | 'daily_update' | 'completion',
  nodes: ValueNode[],
  edges: Edge[]
): Promise<string> {
  const { revId, timestamp } = createRevisionIdentifier();
  const currentRevId = await getCurrentRevisionId(userId);

  // 1. Create revision record
  const revisionItem: ValuesRevision = {
    PK: getUserPK(userId),
    SK: getValuesRevisionSK(timestamp, revId),
    revId,
    revTs: timestamp,
    parentRevId: currentRevId || undefined,
    message,
    source,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: revisionItem,
    })
  );

  // 2. Write all nodes to snapshot partition
  const snapshotPK = getValuesSnapshotPK(userId, revId);

  for (const node of nodes) {
    const nodeItem: ValueNodeItem = {
      ...node,
      PK: snapshotPK,
      SK: getNodeSK(node.id),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: nodeItem,
      })
    );
  }

  // 3. Write all edges to snapshot partition
  for (const edge of edges) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...edge,
          PK: snapshotPK,
        },
      })
    );
  }

  // 4. Update HEAD pointer
  const headItem: ValuesHead = {
    PK: getUserPK(userId),
    SK: getValuesHeadSK(),
    headRevId: revId,
    headRevTs: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: headItem,
    })
  );

  return revId;
}

/**
 * Add a new driver to the current snapshot (creates new revision)
 */
export async function addDriver(
  userId: UserId,
  title: string,
  notes?: string
): Promise<DriverNode> {
  const driverId = randomUUID() as DriverId;
  const now = new Date().toISOString();

  // Get current snapshot
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  // Create new driver node
  const newDriver: DriverNode = {
    nodeType: 'DRIVER',
    id: driverId,
    userId,
    title,
    notes,
    createdAt: now,
    archived: false,
  };

  // Create new revision with driver added
  await createNewRevision(
    userId,
    `Added driver: ${title}`,
    'weekly_review',
    [...currentNodes, newDriver],
    currentEdges
  );

  return newDriver;
}

/**
 * Add a new milestone under a driver (creates new revision)
 */
export async function addMilestone(
  userId: UserId,
  driverId: DriverId,
  title: string,
  notes?: string,
  parentMilestoneId?: MilestoneId
): Promise<MilestoneNode> {
  const milestoneId = randomUUID() as MilestoneId;
  const now = new Date().toISOString();

  // Verify driver exists
  const driver = await getNodeById(userId, driverId);
  if (!driver || driver.nodeType !== 'DRIVER') {
    throw new Error('Driver not found');
  }

  // If parentMilestoneId provided, verify it exists
  if (parentMilestoneId) {
    const parentMilestone = await getNodeById(userId, parentMilestoneId);
    if (!parentMilestone || parentMilestone.nodeType !== 'MILESTONE') {
      throw new Error('Parent milestone not found');
    }
  }

  // Get current snapshot
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  // Create new milestone node
  const newMilestone: MilestoneNode = {
    nodeType: 'MILESTONE',
    id: milestoneId,
    userId,
    driverId,
    parentMilestoneId,
    title,
    notes,
    createdAt: now,
    archived: false,
  };

  // Create edge from parent (driver or milestone) to this milestone
  const parentId = parentMilestoneId || driverId;
  const existingChildrenCount = currentEdges.filter(e => e.parentNodeId === parentId).length;

  const newEdge: Edge = {
    PK: '', // Will be set in createNewRevision
    SK: getEdgeSK(parentId, existingChildrenCount, milestoneId),
    parentNodeId: parentId,
    childNodeId: milestoneId,
    childNodeType: 'MILESTONE',
    order: existingChildrenCount,
  };

  // Create new revision
  await createNewRevision(
    userId,
    `Added milestone: ${title}`,
    'weekly_review',
    [...currentNodes, newMilestone],
    [...currentEdges, newEdge]
  );

  return newMilestone;
}

/**
 * Add a new action under a driver or milestone (creates new revision)
 */
export async function addAction(
  userId: UserId,
  driverId: DriverId,
  title: string,
  parentMilestoneId?: MilestoneId,
  notes?: string,
  estimatedMinutes?: number,
  trigger?: string
): Promise<ActionNode> {
  const actionId = randomUUID() as ActionId;
  const now = new Date().toISOString();

  // Verify driver exists
  const driver = await getNodeById(userId, driverId);
  if (!driver || driver.nodeType !== 'DRIVER') {
    throw new Error('Driver not found');
  }

  // If parentMilestoneId provided, verify it exists
  if (parentMilestoneId) {
    const parentMilestone = await getNodeById(userId, parentMilestoneId);
    if (!parentMilestone || parentMilestone.nodeType !== 'MILESTONE') {
      throw new Error('Parent milestone not found');
    }
  }

  // Get current snapshot
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  // Create new action node
  const newAction: ActionNode = {
    nodeType: 'ACTION',
    id: actionId,
    userId,
    driverId,
    parentMilestoneId,
    title,
    notes,
    estimatedMinutes,
    trigger,
    createdAt: now,
    archived: false,
  };

  // Create edge from parent (driver or milestone) to this action
  const parentId = parentMilestoneId || driverId;
  const existingChildrenCount = currentEdges.filter(e => e.parentNodeId === parentId).length;

  const newEdge: Edge = {
    PK: '', // Will be set in createNewRevision
    SK: getEdgeSK(parentId, existingChildrenCount, actionId),
    parentNodeId: parentId,
    childNodeId: actionId,
    childNodeType: 'ACTION',
    order: existingChildrenCount,
  };

  // Create new revision
  await createNewRevision(
    userId,
    `Added action: ${title}`,
    'daily_update',
    [...currentNodes, newAction],
    [...currentEdges, newEdge]
  );

  return newAction;
}
