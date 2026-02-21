import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
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

    // Query for the most recent review
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :reviewPrefix)',
        ExpressionAttributeValues: {
          ':pk': getUserPK(userId),
          ':reviewPrefix': 'REVIEW#',
        },
        ScanIndexForward: false, // descending order (most recent first)
        Limit: 1,
      })
    );

    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ lastReviewDate: result.Items[0].completedAt }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ lastReviewDate: null }),
    };
  } catch (error) {
    console.error('Error getting last review:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
