import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updateMilestone } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { UpdateMilestoneRequest, MilestoneId } from '@time-management/shared';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const milestoneId = event.pathParameters?.milestoneId as MilestoneId;
    if (!milestoneId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Milestone ID is required' }),
      };
    }

    const body = JSON.parse(event.body || '{}') as UpdateMilestoneRequest;

    const milestone = await updateMilestone(userId, milestoneId, body);

    return {
      statusCode: 200,
      body: JSON.stringify(milestone),
    };
  } catch (error) {
    console.error('Error updating milestone:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: error instanceof Error && error.message === 'Milestone not found' ? 404 : 500,
      body: JSON.stringify({ message }),
    };
  }
};
