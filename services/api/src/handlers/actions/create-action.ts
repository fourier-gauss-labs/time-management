/**
 * POST /milestones/{milestoneId}/actions
 *
 * Creates a new action for a milestone.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import {
  getActionKey,
  type MilestoneId,
  type ActionId,
  type Action,
  type ActionState,
  type RecurrencePattern,
  type Milestone,
} from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for creating an action
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

    // Get milestone ID from path
    const milestoneId = event.pathParameters?.milestoneId as MilestoneId | undefined;

    if (!milestoneId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Milestone ID is required' }),
      };
    }

    // Parse and validate request body
    interface ActionRequestBody {
      title: string;
      description?: string;
      state?: ActionState;
      recurrencePattern?: RecurrencePattern;
      estimatedMinutes?: number;
      trigger?: string;
    }

    const body: ActionRequestBody = JSON.parse(event.body || '{}');

    if (!body.title || body.title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title is required' }),
      };
    }

    // Find the milestone - we can construct a partial key since PK includes milestoneId
    // PK format: USER#{userId}#MILESTONE#{milestoneId}
    const milestonePK = `USER#${userId}#MILESTONE#${milestoneId}`;

    // eslint-disable-next-line no-console
    console.log('Looking for milestone with PK:', milestonePK);
    // eslint-disable-next-line no-console
    console.log('Table:', TABLE_NAME);

    // Scan with exact PK match
    const queryResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': milestonePK,
        },
        Limit: 1,
      })
    );

    // eslint-disable-next-line no-console
    console.log('Scan result:', JSON.stringify(queryResult, null, 2));
    // eslint-disable-next-line no-console
    console.log('Items found:', queryResult.Items?.length || 0);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      // Log all milestones for this user to debug
      const allUserMilestones = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'begins_with(PK, :userPrefix) AND begins_with(SK, :milestonePrefix)',
          ExpressionAttributeValues: {
            ':userPrefix': `USER#${userId}#MILESTONE`,
            ':milestonePrefix': 'DRIVER#',
          },
        })
      );
      // eslint-disable-next-line no-console
      console.log('All milestones for user:', JSON.stringify(allUserMilestones.Items, null, 2));

      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Milestone not found',
          debug: {
            lookingFor: milestonePK,
            foundMilestones: allUserMilestones.Items?.map(m => ({ PK: m.PK, SK: m.SK, id: m.id })),
          },
        }),
      };
    }

    const milestone = queryResult.Items[0] as Milestone;
    if (milestone.userId !== userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden' }),
      };
    }

    const actionId = randomUUID() as ActionId;
    const now = new Date().toISOString();
    const actionKey = getActionKey(userId, milestoneId, actionId);

    const action: Action = {
      id: actionId,
      userId,
      milestoneId,
      title: body.title.trim(),
      description: body.description?.trim(),
      state: body.state || 'planned',
      recurrencePattern: body.recurrencePattern,
      estimatedMinutes: body.estimatedMinutes,
      trigger: body.trigger?.trim(),
      createdAt: now,
      updatedAt: now,
      ...actionKey,
    };

    // Save action
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: action,
      })
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    };
  } catch (error) {
    console.error('Error creating action:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create action',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
