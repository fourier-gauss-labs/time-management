import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Set env before importing handler
process.env.TABLE_NAME = 'test-table';

import { handler } from './update-driver';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('update-driver handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = 'test-table';
  });

  const createMockEvent = (
    userId: string,
    driverId: string,
    body: Record<string, unknown>
  ): APIGatewayProxyEvent => ({
    requestContext: {
      authorizer: { claims: { sub: userId } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
    pathParameters: { driverId },
    body: JSON.stringify(body),
    headers: {},
    isBase64Encoded: false,
    httpMethod: 'PUT',
    path: `/api/drivers/${driverId}`,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
  });

  it('should update driver title', async () => {
    const userId = 'user-123';
    const driverId = 'driver-456';

    ddbMock.on(PutCommand).resolves({});

    const result = await handler(createMockEvent(userId, driverId, { title: 'Updated Title' }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.title).toBe('Updated Title');
    expect(body.id).toBe(driverId);
  });

  it('should update driver description', async () => {
    const userId = 'user-123';
    const driverId = 'driver-456';

    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      createMockEvent(userId, driverId, {
        title: 'Title',
        description: 'New description',
      })
    );

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.description).toBe('New description');
  });

  it('should archive driver', async () => {
    const userId = 'user-123';
    const driverId = 'driver-456';

    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      createMockEvent(userId, driverId, {
        title: 'Title',
        isArchived: true,
      })
    );

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.isArchived).toBe(true);
  });

  it('should unarchive driver', async () => {
    const userId = 'user-123';
    const driverId = 'driver-456';

    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      createMockEvent(userId, driverId, {
        title: 'Title',
        isArchived: false,
      })
    );

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.isArchived).toBe(false);
  });

  it('should reject update without title', async () => {
    const userId = 'user-123';
    const driverId = 'driver-456';

    const result = await handler(createMockEvent(userId, driverId, { description: 'Only desc' }));

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Invalid request');
  });

  it('should reject empty title', async () => {
    const userId = 'user-123';
    const driverId = 'driver-456';

    const result = await handler(createMockEvent(userId, driverId, { title: '  ' }));

    expect(result.statusCode).toBe(400);
  });

  it('should handle missing driverId', async () => {
    const event = createMockEvent('user-123', '', { title: 'Title' });
    event.pathParameters = {};

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });

  it('should handle missing userId', async () => {
    const event = createMockEvent('', 'driver-456', { title: 'Title' });
    event.requestContext.authorizer = {
      claims: {},
    } as APIGatewayProxyEvent['requestContext']['authorizer'];

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
  });

  it('should handle DynamoDB errors', async () => {
    const userId = 'user-123';
    const driverId = 'driver-456';

    ddbMock.on(PutCommand).rejects(new Error('DynamoDB error'));

    const result = await handler(createMockEvent(userId, driverId, { title: 'Title' }));

    expect(result.statusCode).toBe(500);
  });
});
