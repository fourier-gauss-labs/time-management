import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addMilestone } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { CreateMilestoneRequest, DriverId } from '@time-management/shared';

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

    const body = JSON.parse(event.body || '{}') as CreateMilestoneRequest;

    if (!body.title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Title is required' }),
      };
    }

    const milestone = await addMilestone(
      userId,
      driverId,
      body.title,
      body.notes,
      body.parentMilestoneId
    );

    return {
      statusCode: 201,
      body: JSON.stringify(milestone),
    };
  } catch (error) {
    console.error('Error creating milestone:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: 500,
      body: JSON.stringify({ message }),
    };
  }
};
