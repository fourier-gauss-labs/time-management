/**
 * POST /api/drivers/{driverId}/actions
 *
 * Creates a new action under a driver (optionally under a milestone).
 * This creates a new VALUES revision.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserId } from '../../utils/auth';
import { addAction } from '../../repositories/values-repository';
import type { DriverId, MilestoneId } from '@time-management/shared';

interface CreateActionBody {
  title: string;
  notes?: string;
  parentMilestoneId?: MilestoneId;
  estimatedMinutes?: number;
  trigger?: string;
}

/**
 * Main handler for creating an action
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
    const body: CreateActionBody = JSON.parse(event.body || '{}');

    if (!body.title || body.title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title is required' }),
      };
    }

    // Create action (creates new revision)
    const action = await addAction(
      userId,
      driverId,
      body.title.trim(),
      body.parentMilestoneId,
      body.notes?.trim(),
      body.estimatedMinutes,
      body.trigger?.trim()
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    };
  } catch (error) {
    console.error('Error creating action:', error);

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
        error: 'Failed to create action',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
