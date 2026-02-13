/**
 * POST /user/onboarding/reset
 *
 * Resets a user by deleting all their data and re-running onboarding.
 * This is primarily for development and testing purposes.
 *
 * WARNING: This permanently deletes all user data.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getUserPK } from '@time-management/shared';
import { getUserId } from '../../utils/auth';
import { handler as initializeHandler } from './initialize';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Main handler for user reset
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

    // Query all items for this user
    const userPK = getUserPK(userId);
    const items: Array<{ PK: string; SK: string }> = [];

    let lastEvaluatedKey: Record<string, unknown> | undefined;
    do {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': userPK,
          },
          ProjectionExpression: 'PK, SK',
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      if (result.Items) {
        items.push(...(result.Items as Array<{ PK: string; SK: string }>));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Delete all items in batches of 25 (DynamoDB limit)
    if (items.length > 0) {
      const chunks: Array<Array<{ PK: string; SK: string }>> = [];
      for (let i = 0; i < items.length; i += 25) {
        chunks.push(items.slice(i, i + 25));
      }

      for (const chunk of chunks) {
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: chunk.map(item => ({
                DeleteRequest: {
                  Key: {
                    PK: item.PK,
                    SK: item.SK,
                  },
                },
              })),
            },
          })
        );
      }
    }

    // Re-run onboarding to create default content
    const onboardingResult = await initializeHandler(event);

    // Return success
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'User reset successfully',
        deletedItems: items.length,
        onboardingResult: JSON.parse(onboardingResult.body),
      }),
    };
  } catch (error) {
    console.error('Error resetting user:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to reset user',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
