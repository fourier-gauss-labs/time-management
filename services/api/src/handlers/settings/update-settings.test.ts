import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Set env before importing handler
process.env.TABLE_NAME = 'test-table';

import { handler } from './update-settings';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('update-settings handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = 'test-table';
  });

  const createMockEvent = (
    userId: string,
    body: Record<string, unknown> | null
  ): APIGatewayProxyEvent => ({
    requestContext: {
      authorizer: { claims: { sub: userId } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
    body: body ? JSON.stringify(body) : null,
    headers: {},
    isBase64Encoded: false,
    httpMethod: 'PUT',
    path: '/api/user/settings',
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
  });

  it('should update settings with valid review day', async () => {
    const userId = 'user-123';
    const input = { reviewDay: 'friday' };

    ddbMock.on(PutCommand).resolves({});

    const result = await handler(createMockEvent(userId, input));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe(userId);
    expect(body.reviewDay).toBe('friday');
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should reject invalid review day', async () => {
    const userId = 'user-123';
    const input = { reviewDay: 'notaday' };

    const result = await handler(createMockEvent(userId, input));

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Invalid request');
    expect(ddbMock.calls()).toHaveLength(0);
  });

  it('should handle all valid review days', async () => {
    const userId = 'user-123';
    const validDays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    for (const day of validDays) {
      ddbMock.reset();
      ddbMock.on(PutCommand).resolves({});

      const result = await handler(createMockEvent(userId, { reviewDay: day }));

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.reviewDay).toBe(day);
    }
  });

  it('should handle missing body', async () => {
    const event = createMockEvent('user-123', null);
    event.body = null;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Invalid request');
  });

  it('should handle missing userId', async () => {
    const event = createMockEvent('', { reviewDay: 'monday' });
    event.requestContext.authorizer = {
      claims: {},
    } as APIGatewayProxyEvent['requestContext']['authorizer'];

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
  });

  it('should handle DynamoDB errors', async () => {
    const userId = 'user-123';

    ddbMock.on(PutCommand).rejects(new Error('DynamoDB error'));

    const result = await handler(createMockEvent(userId, { reviewDay: 'monday' }));

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Internal server error');
  });
});
