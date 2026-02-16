/**
 * POST /user/onboarding/initialize
 *
 * Initializes onboarding for a new user by creating default content using the new snapshot-based architecture.
 * Idempotent: safe to call multiple times without creating duplicates.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import {
  getUserPK,
  getValuesHeadSK,
  getValuesRevisionSK,
  getValuesSnapshotPK,
  getNodeSK,
  getEdgeSK,
  createRevisionIdentifier,
  type DriverNode,
  type MilestoneNode,
  type ActionNode,
  type DriverId,
  type MilestoneId,
  type ActionId,
} from '@time-management/shared';
import { getUserId } from '../../utils/auth';
import onboardingDefaults from '../../config/onboarding-defaults.json';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

interface OnboardingConfig {
  version: string;
  drivers: Array<{
    title: string;
    description?: string;
    isActive: boolean;
    milestones: Array<{
      title: string;
      description?: string;
      actions: Array<{
        title: string;
        description?: string;
        state: string;
        estimatedMinutes?: number;
        trigger?: string;
        recurrencePattern?: unknown;
      }>;
    }>;
  }>;
}

/**
 * Main handler for onboarding initialization
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract user ID from Cognito authorizer
    const userId = getUserId(event);

    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized: Missing user ID' }),
      };
    }

    // Check if HEAD already exists (idempotency check)
    const userPK = getUserPK(userId);
    const headSK = getValuesHeadSK();

    const existingHead = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: userPK, SK: headSK },
      })
    );

    if (existingHead.Item) {
      // User already onboarded - return existing status
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'User already onboarded',
          alreadyOnboarded: true,
          headRevId: existingHead.Item.headRevId,
        }),
      };
    }

    // Generate revision ID and timestamp
    const { revId, timestamp } = createRevisionIdentifier();
    const now = new Date().toISOString();
    const config = onboardingDefaults as OnboardingConfig;

    // Create nodes and edges from config
    const nodes: Array<DriverNode | MilestoneNode | ActionNode> = [];
    const edges: Array<{ parentNodeId: string; childNodeId: string; order: number }> = [];

    for (const driverConfig of config.drivers) {
      const driverId = `driver-${randomUUID().substring(0, 8)}` as DriverId;

      const driverNode: DriverNode = {
        id: driverId,
        nodeType: 'DRIVER',
        userId,
        title: driverConfig.title,
        notes: driverConfig.description,
        archived: false,
        createdAt: now,
      };
      nodes.push(driverNode);

      let milestoneOrder = 0;
      for (const milestoneConfig of driverConfig.milestones) {
        const milestoneId = `milestone-${randomUUID().substring(0, 8)}` as MilestoneId;

        const milestoneNode: MilestoneNode = {
          id: milestoneId,
          nodeType: 'MILESTONE',
          userId,
          driverId,
          title: milestoneConfig.title,
          notes: milestoneConfig.description,
          createdAt: now,
        };
        nodes.push(milestoneNode);
        edges.push({ parentNodeId: driverId, childNodeId: milestoneId, order: milestoneOrder++ });

        let actionOrder = 0;
        for (const actionConfig of milestoneConfig.actions) {
          const actionId = `action-${randomUUID().substring(0, 8)}` as ActionId;

          const actionNode: ActionNode = {
            id: actionId,
            nodeType: 'ACTION',
            userId,
            driverId,
            parentMilestoneId: milestoneId,
            title: actionConfig.title,
            notes: actionConfig.description,
            estimatedMinutes: actionConfig.estimatedMinutes,
            trigger: actionConfig.trigger,
            createdAt: now,
          };
          nodes.push(actionNode);
          edges.push({ parentNodeId: milestoneId, childNodeId: actionId, order: actionOrder++ });
        }
      }
    }

    // Write HEAD pointer
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: userPK,
          SK: headSK,
          headRevId: revId,
          headRevTs: timestamp,
          updatedAt: timestamp,
        },
      })
    );

    // Write REV record
    const revSK = getValuesRevisionSK(timestamp, revId);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: userPK,
          SK: revSK,
          revId,
          timestamp,
          commitMessage: 'Initial onboarding content',
          nodeCount: nodes.length,
          edgeCount: edges.length,
        },
      })
    );

    // Write all nodes to snapshot partition
    const snapshotPK = getValuesSnapshotPK(userId, revId);
    for (const node of nodes) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: snapshotPK,
            SK: getNodeSK(node.id),
            ...node,
          },
        })
      );
    }

    // Write all edges to snapshot partition
    for (const edge of edges) {
      const edgeSK = getEdgeSK(edge.parentNodeId, edge.order, edge.childNodeId);
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: snapshotPK,
            SK: edgeSK,
            parentNodeId: edge.parentNodeId,
            childNodeId: edge.childNodeId,
            order: edge.order,
            createdAt: now,
          },
        })
      );
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Onboarding completed successfully',
        revId,
        created: {
          drivers: config.drivers.length,
          nodes: nodes.length,
          edges: edges.length,
        },
      }),
    };
  } catch (error) {
    console.error('Error during onboarding initialization:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to initialize onboarding',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
