import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addAction } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { CreateActionRequest, DriverId } from '@time-management/shared';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const driverId = event.pathParameters?.driverId as DriverId;
    if (!driverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Driver ID is required' }),
      };
    }

    const body = JSON.parse(event.body || '{}') as CreateActionRequest;

    if (!body.title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Title is required' }),
      };
    }

    const action = await addAction(
      userId,
      driverId,
      body.title,
      body.parentMilestoneId,
      body.notes,
      body.estimatedMinutes,
      body.trigger
    );

    return {
      statusCode: 201,
      body: JSON.stringify(action),
    };
  } catch (error) {
    console.error('Error creating action:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: 500,
      body: JSON.stringify({ message }),
    };
  }
};
