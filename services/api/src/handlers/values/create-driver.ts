import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addDriver } from '../../repositories/values-repository';
import { getUserIdFromEvent } from '../../utils/auth';
import type { CreateDriverRequest } from '@time-management/shared';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body || '{}') as CreateDriverRequest;

    if (!body.title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Title is required' }),
      };
    }

    const driver = await addDriver(userId, body.title, body.notes);

    return {
      statusCode: 201,
      body: JSON.stringify(driver),
    };
  } catch (error) {
    console.error('Error creating driver:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
