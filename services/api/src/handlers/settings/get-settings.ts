/**
 * GET /user/settings
 *
 * Retrieves the current settings for the authenticated user.
 * Returns default settings if none exist.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getUserSettingsKey, type UserId, type UserSettings } from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Default user settings
 */
const DEFAULT_SETTINGS: Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'> = {
  reviewDay: 'sunday',
};

/**
 * Main handler for user settings retrieval
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

    // Retrieve settings from DynamoDB
    const settingsKey = getUserSettingsKey(userId);
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: settingsKey,
      })
    );

    if (!result.Item) {
      // Return default settings if none exist
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...DEFAULT_SETTINGS,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error retrieving user settings:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to retrieve user settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
