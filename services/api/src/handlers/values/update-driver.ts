import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updateDriver } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { UpdateDriverRequest, DriverId } from '@time-management/shared';

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

    const body = JSON.parse(event.body || '{}') as UpdateDriverRequest;

    const driver = await updateDriver(userId, driverId, body);

    return {
      statusCode: 200,
      body: JSON.stringify(driver),
    };
  } catch (error) {
    console.error('Error updating driver:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: error instanceof Error && error.message === 'Driver not found' ? 404 : 500,
      body: JSON.stringify({ message }),
    };
  }
};
