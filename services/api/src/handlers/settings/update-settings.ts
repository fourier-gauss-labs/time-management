/**
 * PUT /user/settings
 *
 * Updates the settings for the authenticated user.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  getUserSettingsKey,
  type UserId,
  type UserSettings,
  type UpdateUserSettingsInput,
  type DayOfWeekString,
} from '@time-management/shared';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

const VALID_DAYS: DayOfWeekString[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Main handler for user settings update
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

    // Parse and validate request body
    const body: UpdateUserSettingsInput = JSON.parse(event.body || '{}');

    if (body.reviewDay && !VALID_DAYS.includes(body.reviewDay)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid review day',
          validValues: VALID_DAYS,
        }),
      };
    }

    // Get existing settings or create new
    const settingsKey = getUserSettingsKey(userId);
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: settingsKey,
      })
    );

    const now = new Date().toISOString();
    const settings: UserSettings = existingResult.Item
      ? {
          ...(existingResult.Item as UserSettings),
          ...body,
          updatedAt: now,
        }
      : {
          userId,
          reviewDay: body.reviewDay || 'sunday',
          createdAt: now,
          updatedAt: now,
          ...settingsKey,
        };

    // Save updated settings
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: settings,
      })
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    };
  } catch (error) {
    console.error('Error updating user settings:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to update user settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
