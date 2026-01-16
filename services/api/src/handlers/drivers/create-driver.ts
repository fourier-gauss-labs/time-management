/**
 * POST /drivers
 *
 * Creates a new driver for the authenticated user.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import {
  getDriverKey,
  type UserId,
  type Driver,
  type CreateDriverInput,
  type DriverId,
} from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for creating a driver
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

    // Parse and validate request body
    const body: CreateDriverInput = JSON.parse(event.body || '{}');

    if (!body.title || body.title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title is required' }),
      };
    }

    const driverId = randomUUID() as DriverId;
    const now = new Date().toISOString();
    const driverKey = getDriverKey(userId, driverId);

    const driver: Driver = {
      id: driverId,
      userId,
      title: body.title.trim(),
      description: body.description?.trim(),
      isActive: body.isActive ?? true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      ...driverKey,
    };

    // Save driver
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: driver,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    };
  } catch (error) {
    console.error('Error creating driver:', error);

    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Driver already exists' }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
