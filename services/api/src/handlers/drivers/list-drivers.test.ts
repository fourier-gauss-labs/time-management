import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Set env before importing handler
process.env.TABLE_NAME = 'test-table';

import { handler } from './list-drivers';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('list-drivers handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = 'test-table';
  });

  const createMockEvent = (userId: string, includeArchived?: string): APIGatewayProxyEvent => ({
    requestContext: {
      authorizer: { claims: { sub: userId } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
    queryStringParameters: includeArchived ? { includeArchived } : null,
    headers: {},
    body: null,
    isBase64Encoded: false,
    httpMethod: 'GET',
    path: '/api/drivers',
    pathParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
  });

  it('should list only active drivers by default', async () => {
    const userId = 'user-123';

    ddbMock.on(QueryCommand).resolves({
      Items: [
        { id: 'd1', userId, title: 'Active Driver', isArchived: false },
        { id: 'd2', userId, title: 'Another Active', isArchived: false },
      ],
    });

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.drivers).toHaveLength(2);
    expect(body.drivers[0].isArchived).toBe(false);
  });

  it('should include archived drivers when requested', async () => {
    const userId = 'user-123';

    ddbMock.on(QueryCommand).resolves({
      Items: [
        { id: 'd1', userId, title: 'Active Driver', isArchived: false },
        { id: 'd2', userId, title: 'Archived Driver', isArchived: true },
      ],
    });

    const result = await handler(createMockEvent(userId, 'true'));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.drivers).toHaveLength(2);
  });

  it('should filter out archived drivers when includeArchived=false', async () => {
    const userId = 'user-123';

    ddbMock.on(QueryCommand).resolves({
      Items: [
        { id: 'd1', userId, title: 'Active Driver', isArchived: false },
        { id: 'd2', userId, title: 'Archived Driver', isArchived: true },
        { id: 'd3', userId, title: 'Another Active', isArchived: false },
      ],
    });

    const result = await handler(createMockEvent(userId, 'false'));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.drivers).toHaveLength(2);
    expect(body.drivers.every((d: { isArchived: boolean }) => !d.isArchived)).toBe(true);
  });

  it('should return empty list when no drivers exist', async () => {
    const userId = 'user-123';

    ddbMock.on(QueryCommand).resolves({ Items: [] });

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.drivers).toEqual([]);
  });

  it('should handle missing userId', async () => {
    const event = createMockEvent('');
    event.requestContext.authorizer = {
      claims: {},
    } as APIGatewayProxyEvent['requestContext']['authorizer'];

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
  });

  it('should handle DynamoDB errors', async () => {
    const userId = 'user-123';

    ddbMock.on(QueryCommand).rejects(new Error('DynamoDB error'));

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(500);
  });

  it('should use correct query parameters', async () => {
    const userId = 'user-123';

    ddbMock.on(QueryCommand).resolves({ Items: [] });

    await handler(createMockEvent(userId));

    const call = ddbMock.calls()[0];
    expect(call.args[0].input).toMatchObject({
      KeyConditionExpression: 'begins_with(PK, :pkPrefix)',
      ExpressionAttributeValues: {
        ':pkPrefix': `USER#${userId}#DRIVER#`,
      },
    });
  });
});
