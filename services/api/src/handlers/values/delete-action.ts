import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteAction } from '../../repositories/values-repository';
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

    await deleteAction(userId, actionId);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting action:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: error instanceof Error && error.message === 'Action not found' ? 404 : 500,
      body: JSON.stringify({ message }),
    };
  }
};
