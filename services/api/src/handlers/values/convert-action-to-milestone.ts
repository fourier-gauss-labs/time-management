import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { convertActionToMilestone } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { ActionId } from '@time-management/shared';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const actionId = event.pathParameters?.actionId as ActionId;
    if (!actionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Action ID is required' }),
      };
    }

    const milestone = await convertActionToMilestone(userId, actionId);

    return {
      statusCode: 200,
      body: JSON.stringify(milestone),
    };
  } catch (error) {
    console.error('Error converting action to milestone:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: error instanceof Error && error.message === 'Action not found' ? 404 : 500,
      body: JSON.stringify({ message }),
    };
  }
};
