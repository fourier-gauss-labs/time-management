/**
 * GET /api/values/hierarchy
 *
 * Returns the complete values hierarchy for the authenticated user,
 * including all drivers, milestones, actions, and edges.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserId } from '../../utils/auth';
import { getCurrentSnapshot, getCurrentEdges } from '../../repositories/values-repository';

/**
 * Main handler for getting values hierarchy
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized - missing user ID' }),
      };
    }

    // Get all nodes and edges from current snapshot
    const [nodes, edges] = await Promise.all([getCurrentSnapshot(userId), getCurrentEdges(userId)]);

    // Separate nodes by type for easier consumption
    const drivers = nodes.filter(node => node.nodeType === 'DRIVER');
    const milestones = nodes.filter(node => node.nodeType === 'MILESTONE');
    const actions = nodes.filter(node => node.nodeType === 'ACTION');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes,
        edges,
        drivers,
        milestones,
        actions,
      }),
    };
  } catch (error) {
    console.error('Error getting values hierarchy:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to get values hierarchy',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
