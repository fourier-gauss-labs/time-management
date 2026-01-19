/**
 * POST /drivers/{driverId}/milestones
 *
 * Creates a new milestone for a driver.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import {
  getMilestoneKey,
  getDriverKey,
  type DriverId,
  type MilestoneId,
  type Milestone,
  type Driver,
} from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for creating a milestone
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

    // Get driver ID from path
    const driverId = event.pathParameters?.driverId as DriverId | undefined;

    if (!driverId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Driver ID is required' }),
      };
    }

    // Verify driver exists and belongs to user
    const driverKey = getDriverKey(userId, driverId);
    const driverResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: driverKey,
      })
    );

    if (!driverResult.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Driver not found' }),
      };
    }

    const driver = driverResult.Item as Driver;
    if (driver.userId !== userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden' }),
      };
    }

    // Parse and validate request body
    interface MilestoneRequestBody {
      title: string;
      description?: string;
      targetDate?: string;
    }

    const body: MilestoneRequestBody = JSON.parse(event.body || '{}');

    if (!body.title || body.title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title is required' }),
      };
    }

    const milestoneId = randomUUID() as MilestoneId;
    const now = new Date().toISOString();
    const milestoneKey = getMilestoneKey(userId, driverId, milestoneId);

    const milestone: Milestone = {
      id: milestoneId,
      userId,
      driverId,
      title: body.title.trim(),
      description: body.description?.trim(),
      targetDate: body.targetDate,
      createdAt: now,
      updatedAt: now,
      ...milestoneKey,
    };

    // Save milestone
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: milestone,
      })
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone),
    };
  } catch (error) {
    console.error('Error creating milestone:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create milestone',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
