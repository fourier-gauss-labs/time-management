import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getUserPK } from '@time-management/shared';
import { getUserId } from '../../utils/auth';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const now = new Date().toISOString();

    // Store review completion record
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: getUserPK(userId),
          SK: `REVIEW#${now}`,
          completedAt: now,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ completedAt: now }),
    };
  } catch (error) {
    console.error('Error completing review:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
