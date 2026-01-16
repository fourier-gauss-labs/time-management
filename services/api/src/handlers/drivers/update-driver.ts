/**
 * PUT /drivers/{driverId}
 *
 * Updates a driver for the authenticated user.
 * Supports partial updates including archival.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  getDriverKey,
  type DriverId,
  type Driver,
  type UpdateDriverInput,
} from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for updating a driver
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

    // Parse update input
    const updates: UpdateDriverInput = JSON.parse(event.body || '{}');

    // Retrieve existing driver
    const driverKey = getDriverKey(userId, driverId);
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: driverKey,
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Driver not found' }),
      };
    }

    const existingDriver = result.Item as Driver;

    // Verify ownership
    if (existingDriver.userId !== userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden' }),
      };
    }

    // Apply updates
    const updatedDriver: Driver = {
      ...existingDriver,
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.description !== undefined && { description: updates.description?.trim() }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      ...(updates.isArchived !== undefined && { isArchived: updates.isArchived }),
      updatedAt: new Date().toISOString(),
    };

    // Validate title if updated
    if (updates.title !== undefined && updatedDriver.title.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title cannot be empty' }),
      };
    }

    // Save updated driver
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedDriver,
      })
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDriver),
    };
  } catch (error) {
    console.error('Error updating driver:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to update driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
