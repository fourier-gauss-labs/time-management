/**
 * GET /api/drivers
 *
 * Lists all drivers for the authenticated user from the current VALUES snapshot.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserId } from '../../utils/auth';
import { getCurrentSnapshot } from '../../repositories/values-repository';
import type { DriverNode } from '@time-management/shared';

/**
 * Main handler for listing drivers
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);

    // Get all nodes from current snapshot
    const nodes = await getCurrentSnapshot(userId);

    // Filter to only drivers
    const drivers = nodes.filter(node => node.nodeType === 'DRIVER') as DriverNode[];

    // Sort by creation date (newest first)
    drivers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drivers }),
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
