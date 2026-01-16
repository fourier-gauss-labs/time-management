/**
 * GET /drivers
 *
 * Retrieves all drivers for the authenticated user.
 * Optionally filters by archived status.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { type Driver } from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for listing drivers
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

    // Get query parameters
    const includeArchived = event.queryStringParameters?.includeArchived === 'true';

    // Scan for drivers belonging to this user (temporary workaround)
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pkPrefix) AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pkPrefix': `USER#${userId}#DRIVER#`,
          ':skPrefix': 'DRIVER#',
        },
      })
    );

    let drivers = (result.Items || []) as Driver[];

    // Filter out archived drivers unless requested
    if (!includeArchived) {
      drivers = drivers.filter(d => !d.isArchived);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drivers,
        count: drivers.length,
      }),
    };
  } catch (error) {
    console.error('Error listing drivers:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to list drivers',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
