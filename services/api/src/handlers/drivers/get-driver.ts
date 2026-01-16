/**
 * GET /drivers/{driverId}
 *
 * Retrieves a specific driver by ID for the authenticated user.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDriverKey, type DriverId, type Driver } from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for getting a driver
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

    // Retrieve driver
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

    const driver = result.Item as Driver;

    // Verify ownership
    if (driver.userId !== userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    };
  } catch (error) {
    console.error('Error getting driver:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to get driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
