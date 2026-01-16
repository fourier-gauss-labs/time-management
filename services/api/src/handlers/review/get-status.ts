/**
 * GET /review/status
 *
 * Returns the review status for the authenticated user.
 * Includes last completion timestamp and whether a review is currently due.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  getReviewStatusKey,
  getUserSettingsKey,
  type UserId,
  type ReviewStatus,
  type UserSettings,
  type DayOfWeekString,
} from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

const DAY_MAP: Record<DayOfWeekString, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Checks if a review is due based on settings and last completion
 */
function isReviewDue(
  reviewDay: DayOfWeekString,
  lastCompletedAt?: string,
  now: Date = new Date()
): boolean {
  const targetDay = DAY_MAP[reviewDay];
  const currentDay = now.getDay();

  // If never completed, review is due if it's the review day or later in the week
  if (!lastCompletedAt) {
    return currentDay >= targetDay;
  }

  const lastCompleted = new Date(lastCompletedAt);

  // Get the most recent occurrence of the review day
  const daysSinceReviewDay = (currentDay - targetDay + 7) % 7;
  const mostRecentReviewDay = new Date(now);
  mostRecentReviewDay.setDate(now.getDate() - daysSinceReviewDay);
  mostRecentReviewDay.setHours(0, 0, 0, 0);

  // Review is due if the last completion was before the most recent review day
  return lastCompleted < mostRecentReviewDay;
}

/**
 * Main handler for review status retrieval
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

    // Get user settings to determine review day
    const settingsKey = getUserSettingsKey(userId);
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: settingsKey,
      })
    );

    const reviewDay: DayOfWeekString =
      (settingsResult.Item as UserSettings | undefined)?.reviewDay || 'sunday';

    // Get review status
    const reviewStatusKey = getReviewStatusKey(userId);
    const statusResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: reviewStatusKey,
      })
    );

    const reviewStatus = statusResult.Item as ReviewStatus | undefined;
    const lastCompletedAt = reviewStatus?.lastCompletedAt;
    const isDue = isReviewDue(reviewDay, lastCompletedAt);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        reviewDay,
        lastCompletedAt,
        isDue,
      }),
    };
  } catch (error) {
    console.error('Error retrieving review status:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to retrieve review status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
