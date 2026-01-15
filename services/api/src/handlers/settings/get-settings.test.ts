import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Set env before importing handler
process.env.TABLE_NAME = 'test-table';

import { handler } from './get-settings';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('get-settings handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = 'test-table';
  });

  const createMockEvent = (userId: string): APIGatewayProxyEvent => ({
    requestContext: {
      authorizer: { claims: { sub: userId } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
    headers: {},
    body: null,
    isBase64Encoded: false,
    httpMethod: 'GET',
    path: '/api/user/settings',
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
  });

  it('should return existing settings', async () => {
    const userId = 'user-123';
    const existingSettings = {
      userId,
      reviewDay: 'monday',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    ddbMock.on(GetCommand).resolves({ Item: existingSettings });

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual(existingSettings);
    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should return default settings when none exist', async () => {
    const userId = 'user-456';

    ddbMock.on(GetCommand).resolves({});

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe(userId);
    expect(body.reviewDay).toBe('sunday');
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });

  it('should handle missing user ID', async () => {
    const event = createMockEvent('');
    event.requestContext.authorizer = {
      claims: {},
    } as APIGatewayProxyEvent['requestContext']['authorizer'];

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
  });

  it('should handle DynamoDB errors', async () => {
    const userId = 'user-789';

    ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Internal server error');
  });

  it('should use correct table name from environment', async () => {
    const userId = 'user-123';

    ddbMock.on(GetCommand).resolves({});

    await handler(createMockEvent(userId));

    const call = ddbMock.calls()[0];
    expect(call.args[0].input).toMatchObject({
      TableName: 'test-table',
    });
  });
});
