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
  type UpdateDriverRequest,
  type UpdateMilestoneRequest,
  type UpdateActionRequest,
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
    status: 'not-started',
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

/**
 * Update a driver (creates new revision)
 */
export async function updateDriver(
  userId: UserId,
  driverId: DriverId,
  updates: UpdateDriverRequest
): Promise<DriverNode> {
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  const driverIndex = currentNodes.findIndex(n => n.id === driverId);
  if (driverIndex === -1 || currentNodes[driverIndex].nodeType !== 'DRIVER') {
    throw new Error('Driver not found');
  }

  const existingDriver = currentNodes[driverIndex] as DriverNode & { PK: string; SK: string };
  const updatedDriver = {
    ...existingDriver,
    ...updates,
  };

  const updatedNodes = [...currentNodes];
  updatedNodes[driverIndex] = updatedDriver;

  await createNewRevision(
    userId,
    `Updated driver: ${updatedDriver.title}`,
    'weekly_review',
    updatedNodes,
    currentEdges
  );

  // Return driver without PK/SK
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { PK: _PK, SK: _SK, ...driverWithoutKeys } = updatedNodes[driverIndex] as ValueNodeItem;
  return driverWithoutKeys as DriverNode;
}

/**
 * Update a milestone (creates new revision)
 */
export async function updateMilestone(
  userId: UserId,
  milestoneId: MilestoneId,
  updates: UpdateMilestoneRequest
): Promise<MilestoneNode> {
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  const milestoneIndex = currentNodes.findIndex(n => n.id === milestoneId);
  if (milestoneIndex === -1 || currentNodes[milestoneIndex].nodeType !== 'MILESTONE') {
    throw new Error('Milestone not found');
  }

  const existingMilestone = currentNodes[milestoneIndex] as MilestoneNode & {
    PK: string;
    SK: string;
  };
  const updatedMilestone = {
    ...existingMilestone,
    ...updates,
  };

  const updatedNodes = [...currentNodes];
  updatedNodes[milestoneIndex] = updatedMilestone;

  await createNewRevision(
    userId,
    `Updated milestone: ${updatedMilestone.title}`,
    'weekly_review',
    updatedNodes,
    currentEdges
  );

  // Return milestone without PK/SK
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    PK: _PK,
    SK: _SK,
    ...milestoneWithoutKeys
  } = updatedNodes[milestoneIndex] as ValueNodeItem;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return milestoneWithoutKeys as MilestoneNode;
}

/**
 * Update an action (creates new revision)
 */
export async function updateAction(
  userId: UserId,
  actionId: ActionId,
  updates: UpdateActionRequest
): Promise<ActionNode> {
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  const actionIndex = currentNodes.findIndex(n => n.id === actionId);
  if (actionIndex === -1 || currentNodes[actionIndex].nodeType !== 'ACTION') {
    throw new Error('Action not found');
  }

  const existingAction = currentNodes[actionIndex] as ActionNode & { PK: string; SK: string };
  const updatedAction = {
    ...existingAction,
    ...updates,
  };

  // If status is being set to 'complete' and completedAt is not set, set it
  if (updates.status === 'complete' && !updatedAction.completedAt) {
    updatedAction.completedAt = new Date().toISOString();
  }

  // If status is being changed from 'complete' to something else, clear completedAt
  if (updates.status && updates.status !== 'complete' && existingAction.status === 'complete') {
    delete updatedAction.completedAt;
  }

  const updatedNodes = [...currentNodes];
  updatedNodes[actionIndex] = updatedAction;

  await createNewRevision(
    userId,
    `Updated action: ${updatedAction.title}`,
    'daily_update',
    updatedNodes,
    currentEdges
  );

  // Return action without PK/SK
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { PK: _PK, SK: _SK, ...actionWithoutKeys } = updatedNodes[actionIndex] as ValueNodeItem;
  return actionWithoutKeys as ActionNode;
}

/**
 * Delete a driver and all its children (creates new revision)
 */
export async function deleteDriver(userId: UserId, driverId: DriverId): Promise<void> {
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  const driver = currentNodes.find(n => n.id === driverId && n.nodeType === 'DRIVER');
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Find all nodes that belong to this driver
  const nodesToRemove = new Set<string>([driverId]);

  // Remove all milestones and actions under this driver
  for (const node of currentNodes) {
    if (
      (node.nodeType === 'MILESTONE' || node.nodeType === 'ACTION') &&
      'driverId' in node &&
      node.driverId === driverId
    ) {
      nodesToRemove.add(node.id);
    }
  }

  // Filter out removed nodes
  const updatedNodes = currentNodes.filter(n => !nodesToRemove.has(n.id));

  // Filter out edges that reference removed nodes
  const updatedEdges = currentEdges.filter(
    e => !nodesToRemove.has(e.parentNodeId) && !nodesToRemove.has(e.childNodeId)
  );

  await createNewRevision(
    userId,
    `Deleted driver: ${driver.title}`,
    'weekly_review',
    updatedNodes,
    updatedEdges
  );
}

/**
 * Delete a milestone and all its children (creates new revision)
 */
export async function deleteMilestone(userId: UserId, milestoneId: MilestoneId): Promise<void> {
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  const milestone = currentNodes.find(n => n.id === milestoneId && n.nodeType === 'MILESTONE');
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  // Find all descendants recursively
  const nodesToRemove = new Set<string>([milestoneId]);

  const findDescendants = (parentId: string) => {
    const childEdges = currentEdges.filter(e => e.parentNodeId === parentId);
    for (const edge of childEdges) {
      nodesToRemove.add(edge.childNodeId);
      findDescendants(edge.childNodeId);
    }
  };

  findDescendants(milestoneId);

  // Filter out removed nodes
  const updatedNodes = currentNodes.filter(n => !nodesToRemove.has(n.id));

  // Filter out edges that reference removed nodes
  const updatedEdges = currentEdges.filter(
    e => !nodesToRemove.has(e.parentNodeId) && !nodesToRemove.has(e.childNodeId)
  );

  await createNewRevision(
    userId,
    `Deleted milestone: ${milestone.title}`,
    'weekly_review',
    updatedNodes,
    updatedEdges
  );
}

/**
 * Delete an action (creates new revision)
 */
export async function deleteAction(userId: UserId, actionId: ActionId): Promise<void> {
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  const action = currentNodes.find(n => n.id === actionId && n.nodeType === 'ACTION');
  if (!action) {
    throw new Error('Action not found');
  }

  // Remove the action node
  const updatedNodes = currentNodes.filter(n => n.id !== actionId);

  // Remove edges that reference this action
  const updatedEdges = currentEdges.filter(
    e => e.parentNodeId !== actionId && e.childNodeId !== actionId
  );

  await createNewRevision(
    userId,
    `Deleted action: ${action.title}`,
    'daily_update',
    updatedNodes,
    updatedEdges
  );
}

/**
 * Convert an action to a milestone (creates new revision)
 */
export async function convertActionToMilestone(
  userId: UserId,
  actionId: ActionId
): Promise<MilestoneNode> {
  const currentNodes = await getCurrentSnapshot(userId);
  const currentEdges = await getCurrentEdges(userId);

  const actionIndex = currentNodes.findIndex(n => n.id === actionId && n.nodeType === 'ACTION');
  if (actionIndex === -1) {
    throw new Error('Action not found');
  }

  const action = currentNodes[actionIndex] as ActionNode & { PK: string; SK: string };

  // Create milestone from action (preserve PK/SK for snapshot)
  const newMilestone = {
    nodeType: 'MILESTONE' as const,
    id: randomUUID() as MilestoneId,
    userId: action.userId,
    driverId: action.driverId,
    parentMilestoneId: action.parentMilestoneId,
    title: action.title,
    notes: action.notes,
    createdAt: action.createdAt,
    archived: action.archived,
    PK: action.PK,
    SK: getNodeSK(action.id), // Keep same SK structure for now
  };

  // Update nodes: replace action with milestone
  const updatedNodes = [...currentNodes];
  updatedNodes[actionIndex] = newMilestone;

  // Update edges: replace action references with milestone references
  const updatedEdges = currentEdges.map(edge => {
    if (edge.childNodeId === actionId) {
      return {
        ...edge,
        childNodeId: newMilestone.id,
        childNodeType: 'MILESTONE' as const,
      };
    }
    return edge;
  });

  await createNewRevision(
    userId,
    `Converted action "${action.title}" to milestone`,
    'weekly_review',
    updatedNodes,
    updatedEdges
  );

  // Return milestone without PK/SK
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { PK: _PK, SK: _SK, ...milestoneWithoutKeys } = newMilestone;
  return milestoneWithoutKeys as MilestoneNode;
}
