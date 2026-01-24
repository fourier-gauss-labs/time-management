/**
 * POST /api/drivers
 *
 * Creates a new driver for the authenticated user.
 * This creates a new VALUES revision.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserId } from '../../utils/auth';
import { addDriver } from '../../repositories/values-repository';

interface CreateDriverBody {
  title: string;
  notes?: string;
}

/**
 * Main handler for creating a driver
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);

    // Parse and validate request body
    const body: CreateDriverBody = JSON.parse(event.body || '{}');

    if (!body.title || body.title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title is required' }),
      };
    }

    // Create driver (creates new revision)
    const driver = await addDriver(userId, body.title.trim(), body.notes?.trim());

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    };
  } catch (error) {
    console.error('Error creating driver:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
