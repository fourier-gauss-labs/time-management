/**
 * GET /user/onboarding/status
 *
 * Returns the current onboarding status for the authenticated user.
 * Used by frontend to determine if onboarding should run.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getOnboardingKey, type UserId } from '@time-management/shared';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for onboarding status retrieval
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

    // Retrieve onboarding status from DynamoDB
    const onboardingKey = getOnboardingKey(userId);
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: onboardingKey,
      })
    );

    if (!result.Item) {
      // User has not been onboarded yet
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isOnboarded: false,
          requiresOnboarding: true,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        isOnboarded: result.Item.isOnboarded,
        onboardingVersion: result.Item.onboardingVersion,
        completedAt: result.Item.completedAt,
        requiresOnboarding: !result.Item.isOnboarded,
      }),
    };
  } catch (error) {
    console.error('Error retrieving onboarding status:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to retrieve onboarding status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
