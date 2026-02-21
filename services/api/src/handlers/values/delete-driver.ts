import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteDriver } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { DriverId } from '@time-management/shared';

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

    await deleteDriver(userId, driverId);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting driver:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: error instanceof Error && error.message === 'Driver not found' ? 404 : 500,
      body: JSON.stringify({ message }),
    };
  }
};
