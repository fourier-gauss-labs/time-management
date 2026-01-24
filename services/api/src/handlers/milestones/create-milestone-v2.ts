/**
 * POST /api/drivers/{driverId}/milestones
 *
 * Creates a new milestone under a driver.
 * This creates a new VALUES revision.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserId } from '../../utils/auth';
import { addMilestone } from '../../repositories/values-repository';
import type { DriverId, MilestoneId } from '@time-management/shared';

interface CreateMilestoneBody {
  title: string;
  notes?: string;
  parentMilestoneId?: MilestoneId;
}

/**
 * Main handler for creating a milestone
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const driverId = event.pathParameters?.driverId as DriverId;

    if (!driverId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Driver ID is required' }),
      };
    }

    // Parse and validate request body
    const body: CreateMilestoneBody = JSON.parse(event.body || '{}');

    if (!body.title || body.title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title is required' }),
      };
    }

    // Create milestone (creates new revision)
    const milestone = await addMilestone(
      userId,
      driverId,
      body.title.trim(),
      body.notes?.trim(),
      body.parentMilestoneId
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone),
    };
  } catch (error) {
    console.error('Error creating milestone:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create milestone',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
