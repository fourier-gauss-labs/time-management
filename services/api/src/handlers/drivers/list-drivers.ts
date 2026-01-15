/**
 * GET /drivers
 *
 * Retrieves all drivers for the authenticated user.
 * Optionally filters by archived status.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { type UserId, type Driver } from '@time-management/shared';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for listing drivers
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub as UserId;

    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized: Missing user ID' }),
      };
    }

    // Get query parameters
    const includeArchived = event.queryStringParameters?.includeArchived === 'true';

    // Query all drivers for this user
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'begins_with(PK, :pkPrefix)',
        ExpressionAttributeValues: {
          ':pkPrefix': `USER#${userId}#DRIVER#`,
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
