/**
 * POST /review/complete
 *
 * Marks the weekly review as completed for the authenticated user.
 * Records the completion timestamp.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getReviewStatusKey, type UserId, type ReviewStatus } from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for review completion
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

    const now = new Date().toISOString();
    const reviewStatusKey = getReviewStatusKey(userId);

    const reviewStatus: ReviewStatus = {
      userId,
      lastCompletedAt: now,
      createdAt: now,
      updatedAt: now,
      ...reviewStatusKey,
    };

    // Save review completion
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: reviewStatus,
      })
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        completedAt: now,
        success: true,
      }),
    };
  } catch (error) {
    console.error('Error completing review:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to complete review',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
