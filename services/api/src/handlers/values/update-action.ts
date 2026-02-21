import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updateAction } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { UpdateActionRequest, ActionId } from '@time-management/shared';

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

    const body = JSON.parse(event.body || '{}') as UpdateActionRequest;

    const action = await updateAction(userId, actionId, body);

    return {
      statusCode: 200,
      body: JSON.stringify(action),
    };
  } catch (error) {
    console.error('Error updating action:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: error instanceof Error && error.message === 'Action not found' ? 404 : 500,
      body: JSON.stringify({ message }),
    };
  }
};
